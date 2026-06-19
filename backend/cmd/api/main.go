package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humaecho"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"fukunishifarm/backend/internal/bootstrap"
	"fukunishifarm/backend/internal/config"
	firebaseauth "fukunishifarm/backend/internal/infra/firebase"
	gormrepo "fukunishifarm/backend/internal/infra/persistence/gorm"
	sessionjwt "fukunishifarm/backend/internal/infra/session"
	"fukunishifarm/backend/internal/transport/httpapi"
	usecasecontact "fukunishifarm/backend/internal/usecase/contact"
	usecaseauth "fukunishifarm/backend/internal/usecase/auth"
	usecasegrape "fukunishifarm/backend/internal/usecase/grape"
	usecasenews "fukunishifarm/backend/internal/usecase/news"

	backenddb "fukunishifarm/backend/internal/db"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	database, err := backenddb.Open(cfg.DatabaseURL)
	if err != nil {
		slog.Error("open database", "error", err)
		os.Exit(1)
	}

	migrated := true
	if err := bootstrap.RequireMigrated(ctx, database); err != nil {
		if errors.Is(err, bootstrap.ErrDatabaseNotMigrated) {
			migrated = false
			slog.Warn("database not migrated", "hint", "run `make migrate`")
		} else {
			slog.Error("check database migration", "error", err)
			os.Exit(1)
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

	adminRepository := gormrepo.NewAdminUserRepository(database)
	contactRepository := gormrepo.NewContactRepository(database)
	grapeRepository := gormrepo.NewGrapeRepository(database)
	newsRepository := gormrepo.NewNewsRepository(database)
	authService := usecaseauth.NewService(authenticator, verifier, verifier, sessionManager, adminRepository)
	contactService := usecasecontact.NewService(contactRepository)
	grapeService := usecasegrape.NewService(grapeRepository)
	newsService := usecasenews.NewService(newsRepository)

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
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if migrated {
				return next(c)
			}

			if c.Request().Method == http.MethodOptions || c.Request().URL.Path == "/healthz" {
				return next(c)
			}

			return c.JSON(http.StatusServiceUnavailable, map[string]string{
				"code":    "database_not_migrated",
				"message": "database migration has not been completed. Run `make migrate`.",
			})
		}
	})

	api := humaecho.New(e, huma.DefaultConfig("Fukunishi Farm API", "1.0.0"))
	httpapi.Register(api, authService, grapeService, newsService, contactService, migrated)

	slog.Info("starting api server", "port", cfg.Port)
	if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
		slog.Error("api server exited", "error", err)
		os.Exit(1)
	}
}
