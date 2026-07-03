package main

import (
	"context"
	"log/slog"
	"os"

	"fukunishifarm/backend/internal/bootstrap"
	"fukunishifarm/backend/internal/config"
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

	if err := bootstrap.MigrateAndSeed(ctx, database); err != nil {
		slog.Error("migrate and seed database", "error", err)
		os.Exit(1)
	}

	slog.Info("database migration and seeding completed")
}
