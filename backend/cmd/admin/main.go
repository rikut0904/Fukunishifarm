package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"os"
	"strings"

	"fukunishifarm/backend/internal/bootstrap"
	"fukunishifarm/backend/internal/config"
	backenddb "fukunishifarm/backend/internal/db"
	firebaseauth "fukunishifarm/backend/internal/infra/firebase"
	gormrepo "fukunishifarm/backend/internal/infra/persistence/gorm"
)

func main() {
	var (
		email       = flag.String("email", "", "Firebase admin email")
		password    = flag.String("password", "", "Firebase admin password")
		displayName = flag.String("display-name", "", "Firebase admin display name")
	)
	flag.Parse()

	if strings.TrimSpace(*email) == "" {
		*email = os.Getenv("EMAIL")
	}
	if strings.TrimSpace(*password) == "" {
		*password = os.Getenv("PASSWORD")
	}
	if strings.TrimSpace(*displayName) == "" {
		*displayName = os.Getenv("DISPLAY_NAME")
	}

	if strings.TrimSpace(*email) == "" || strings.TrimSpace(*password) == "" {
		slog.Error("email and password are required")
		os.Exit(1)
	}

	cfg := config.Load()
	ctx := context.Background()

	database, err := backenddb.Open(cfg.DatabaseURL)
	if err != nil {
		slog.Error("open database", "error", err)
		os.Exit(1)
	}

	if err := bootstrap.RequireMigrated(ctx, database); err != nil {
		if errors.Is(err, bootstrap.ErrDatabaseNotMigrated) {
			slog.Error("database not migrated", "hint", "run `make migrate`")
		} else {
			slog.Error("check database migration", "error", err)
		}
		os.Exit(1)
	}

	verifier, err := firebaseauth.NewVerifier(ctx, cfg.FirebaseProjectID, cfg.FirebaseServiceAccount)
	if err != nil {
		slog.Error("initialize firebase verifier", "error", err)
		os.Exit(1)
	}

	identity, err := verifier.CreateUser(ctx, *email, *password, *displayName)
	if err != nil {
		slog.Error("create firebase user", "error", err)
		os.Exit(1)
	}

	repository := gormrepo.NewAdminUserRepository(database)
	user, err := repository.CreateAdminUser(ctx, identity)
	if err != nil {
		slog.Error("create admin user", "error", err)
		os.Exit(1)
	}

	slog.Info("admin user created", "email", user.Email, "firebase_uid", user.FirebaseUID, "id", user.ID)
}
