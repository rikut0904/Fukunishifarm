package bootstrap

import (
	"context"
	"errors"
	"fmt"

	"fukunishifarm/backend/internal/domain/auth"
	domaincontact "fukunishifarm/backend/internal/domain/contact"
	domaingrape "fukunishifarm/backend/internal/domain/grape"
	domainnews "fukunishifarm/backend/internal/domain/news"
	gormrepo "fukunishifarm/backend/internal/infra/persistence/gorm"
	usecasegrape "fukunishifarm/backend/internal/usecase/grape"
	"gorm.io/gorm"
)

var ErrDatabaseNotMigrated = errors.New("database not migrated")

func MigrateAndSeed(ctx context.Context, db *gorm.DB) error {
	if err := db.AutoMigrate(&auth.AdminUser{}, &domaingrape.Item{}, &domainnews.Item{}, &domaincontact.Message{}, &domaincontact.Reply{}); err != nil {
		return fmt.Errorf("auto migrate: %w", err)
	}

	if db.Migrator().HasColumn(&domainnews.Item{}, "Body") {
		if err := db.Migrator().DropColumn(&domainnews.Item{}, "Body"); err != nil {
			return fmt.Errorf("drop news body column: %w", err)
		}
	}

	grapeService := usecasegrape.NewService(gormrepo.NewGrapeRepository(db))
	if err := grapeService.SeedDefaults(ctx, domaingrape.DefaultCatalog()); err != nil {
		return fmt.Errorf("seed grape catalog: %w", err)
	}

	return nil
}

func RequireMigrated(ctx context.Context, db *gorm.DB) error {
	if !db.Migrator().HasTable(&auth.AdminUser{}) || !db.Migrator().HasTable(&domaingrape.Item{}) || !db.Migrator().HasTable(&domainnews.Item{}) || !db.Migrator().HasTable(&domaincontact.Message{}) || !db.Migrator().HasTable(&domaincontact.Reply{}) {
		return ErrDatabaseNotMigrated
	}

	return nil
}
