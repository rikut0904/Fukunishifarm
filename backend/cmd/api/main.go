package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humaecho"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"

	"fukunishifarm/backend/internal/bootstrap"
	"fukunishifarm/backend/internal/config"
	domainauth "fukunishifarm/backend/internal/domain/auth"
	domaincontact "fukunishifarm/backend/internal/domain/contact"
	emailses "fukunishifarm/backend/internal/infra/email"
	firebaseauth "fukunishifarm/backend/internal/infra/firebase"
	gormrepo "fukunishifarm/backend/internal/infra/persistence/gorm"
	sessionjwt "fukunishifarm/backend/internal/infra/session"
	"fukunishifarm/backend/internal/transport/httpapi"
	usecaseauth "fukunishifarm/backend/internal/usecase/auth"
	usecaseblog "fukunishifarm/backend/internal/usecase/blog"
	usecasecontact "fukunishifarm/backend/internal/usecase/contact"
	usecasegrape "fukunishifarm/backend/internal/usecase/grape"
	usecasenews "fukunishifarm/backend/internal/usecase/news"

	backenddb "fukunishifarm/backend/internal/db"
)

const publicMutationRateLimit = 10
const publicMutationRateWindow = time.Minute

type routeAvailability struct {
	auth    bool
	grape   bool
	contact bool
}

func isRouteAvailable(method, path string, availability routeAvailability) bool {
	if path == "/healthz" || path == "/v1/news" || path == "/v1/blog" || strings.HasPrefix(path, "/v1/blog/") {
		return true
	}

	if path == "/v1/grapes" {
		return availability.grape
	}

	if path == "/v1/contact" || strings.HasPrefix(path, "/v1/contact/") {
		return availability.contact
	}

	if path == "/v1/auth/login" || path == "/v1/auth/session" || strings.HasPrefix(path, "/v1/admin/users") {
		return availability.auth
	}

	if path == "/v1/admin/grapes" || strings.HasPrefix(path, "/v1/admin/grapes/") {
		return availability.auth && availability.grape
	}

	if path == "/v1/admin/contact" || strings.HasPrefix(path, "/v1/admin/contact/") {
		return availability.auth && availability.contact
	}

	return method == http.MethodOptions
}

func isRateLimitedPublicMutation(method, path string) bool {
	if method != http.MethodPost {
		return false
	}

	return path == "/v1/auth/login" ||
		path == "/v1/contact" ||
		strings.HasPrefix(path, "/v1/contact/") && strings.HasSuffix(path, "/replies")
}

func main() {
	cfg := config.Load()
	ctx := context.Background()
	migrated := true
	var database *gorm.DB
	availability := routeAvailability{}

	if strings.TrimSpace(cfg.DatabaseURL) == "" {
		migrated = false
		slog.Warn("database is not configured; starting in public-blog mode", "hint", "set DATABASE_URL and run `make migrate` to enable DB-backed features")
	} else {
		opened, err := backenddb.Open(cfg.DatabaseURL)
		if err != nil {
			migrated = false
			slog.Warn("database is unavailable; starting in public-blog mode", "error", err)
		} else {
			database = opened
			featureAvailability := bootstrap.DetectFeatureAvailability(ctx, database)
			availability = routeAvailability{
				auth:    featureAvailability.Auth,
				grape:   featureAvailability.Grape,
				contact: featureAvailability.Contact,
			}
			if err := bootstrap.RequireMigrated(ctx, database); err != nil {
				if errors.Is(err, bootstrap.ErrDatabaseNotMigrated) {
					migrated = false
					slog.Warn(
						"database not fully migrated",
						"hint", "run `make migrate`",
						"auth_ready", availability.auth,
						"grape_ready", availability.grape,
						"contact_ready", availability.contact,
					)
				} else {
					migrated = false
					slog.Warn("check database migration failed; starting in public-blog mode", "error", err)
				}
			}
		}
	}

	authenticator, err := firebaseauth.NewAuthenticator(cfg.FirebaseWebAPIKey)
	if err != nil {
		slog.Error("initialize firebase authenticator", "error", err)
		os.Exit(1)
	}

	verifier, err := firebaseauth.NewVerifier(ctx, cfg.FirebaseProjectID, cfg.FirebaseServiceAccount)
	if err != nil {
		slog.Error("initialize firebase verifier", "error", err)
		os.Exit(1)
	}

	sessionManager, err := sessionjwt.New(cfg.SessionJWTSecret, 12*time.Hour)
	if err != nil {
		slog.Error("initialize session manager", "error", err)
		os.Exit(1)
	}

	var adminRepository *gormrepo.AdminUserRepository
	var contactRepository *gormrepo.ContactRepository
	var grapeRepository *gormrepo.GrapeRepository
	if database != nil && availability.auth {
		adminRepository = gormrepo.NewAdminUserRepository(database)
	}
	if database != nil && availability.contact {
		contactRepository = gormrepo.NewContactRepository(database)
	}
	if database != nil && availability.grape {
		grapeRepository = gormrepo.NewGrapeRepository(database)
	}
	var contactReplySender domaincontact.ReplyEmailSender
	var invitationMailer domainauth.InvitationEmailSender
	if strings.TrimSpace(cfg.AWSRegion) != "" && strings.TrimSpace(cfg.SESFromEmail) != "" {
		sender, err := emailses.NewSESReplySender(ctx, cfg.AWSRegion, cfg.AWSAccessKeyID, cfg.AWSSecretAccessKey, cfg.AWSSessionToken, cfg.SESFromEmail)
		if err != nil {
			slog.Error("initialize SES reply sender", "error", err)
			os.Exit(1)
		}
		contactReplySender = sender
		invitationMailer = sender
	} else {
		slog.Warn("SES sender is disabled", "hint", "set AWS_REGION and SES_FROM_EMAIL to enable mail delivery")
	}
	authService := usecaseauth.NewService(authenticator, verifier, verifier, sessionManager, adminRepository, invitationMailer, cfg.AdminLoginURL)
	contactService := usecasecontact.NewService(contactRepository, adminRepository, contactReplySender, cfg.SiteBaseURL)
	grapeService := usecasegrape.NewService(grapeRepository)
	if cfg.MicroCMSServiceDomain == "" || cfg.MicroCMSAPIKey == "" {
		slog.Warn("microCMS is not fully configured; blog and news features will be unavailable", "domain", cfg.MicroCMSServiceDomain, "has_key", cfg.MicroCMSAPIKey != "")
	}
	newsService := usecasenews.NewService(cfg.MicroCMSServiceDomain, cfg.MicroCMSAPIKey, cfg.MicroCMSNewsEndpoint)
	blogService := usecaseblog.NewService(cfg.MicroCMSServiceDomain, cfg.MicroCMSAPIKey, cfg.MicroCMSBlogEndpoint)

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.CORSAllowOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: false,
	}))
	e.Use(middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Skipper: func(c echo.Context) bool {
			return !isRateLimitedPublicMutation(c.Request().Method, c.Request().URL.Path)
		},
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{
			Rate:      publicMutationRateLimit,
			ExpiresIn: publicMutationRateWindow,
		}),
		IdentifierExtractor: func(c echo.Context) (string, error) {
			return c.RealIP() + ":" + c.Request().Method + ":" + c.Path(), nil
		},
		ErrorHandler: func(c echo.Context, err error) error {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"code":    "rate_limiter_error",
				"message": "rate limiter error",
			})
		},
		DenyHandler: func(c echo.Context, identifier string, err error) error {
			return c.JSON(http.StatusTooManyRequests, map[string]string{
				"code":    "rate_limited",
				"message": "too many requests, please try again later",
			})
		},
	}))
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if isRouteAvailable(c.Request().Method, c.Request().URL.Path, availability) {
				return next(c)
			}

			return c.JSON(http.StatusServiceUnavailable, map[string]string{
				"code":    "database_not_migrated",
				"message": "required database tables are not available for this feature. Run `make migrate`.",
			})
		}
	})

	api := humaecho.New(e, huma.DefaultConfig("Fukunishi Farm API", "1.0.0"))
	httpapi.Register(api, authService, grapeService, newsService, blogService, contactService, migrated)

	slog.Info("starting api server", "port", cfg.Port)
	if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
		slog.Error("api server exited", "error", err)
		os.Exit(1)
	}
}
