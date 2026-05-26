package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humaecho"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"fukunishifarm/backend/internal/config"
	"fukunishifarm/backend/internal/domain/auth"
	firebaseauth "fukunishifarm/backend/internal/infra/firebase"
	gormrepo "fukunishifarm/backend/internal/infra/persistence/gorm"
	sessionjwt "fukunishifarm/backend/internal/infra/session"
	"fukunishifarm/backend/internal/transport/httpapi"
	usecaseauth "fukunishifarm/backend/internal/usecase/auth"

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

	if err := database.AutoMigrate(&auth.AdminUser{}); err != nil {
		slog.Error("auto migrate", "error", err)
		os.Exit(1)
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
	authService := usecaseauth.NewService(authenticator, verifier, verifier, sessionManager, adminRepository)

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.CORSAllowOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: false,
	}))

	api := humaecho.New(e, huma.DefaultConfig("Fukunishi Farm API", "1.0.0"))
	httpapi.Register(api, authService)

	slog.Info("starting api server", "port", cfg.Port)
	if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
		slog.Error("api server exited", "error", err)
		os.Exit(1)
	}
}
