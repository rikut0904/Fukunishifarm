package bootstrap

import (
	"context"
	"errors"
	"fmt"

	"fukunishifarm/backend/internal/domain/auth"
	domaingrape "fukunishifarm/backend/internal/domain/grape"
	gormrepo "fukunishifarm/backend/internal/infra/persistence/gorm"
	usecasegrape "fukunishifarm/backend/internal/usecase/grape"
	"gorm.io/gorm"
)

var ErrDatabaseNotMigrated = errors.New("database not migrated")

func MigrateAndSeed(ctx context.Context, db *gorm.DB) error {
	if err := db.AutoMigrate(&auth.AdminUser{}, &domaingrape.Item{}); err != nil {
		return fmt.Errorf("auto migrate: %w", err)
	}

	grapeService := usecasegrape.NewService(gormrepo.NewGrapeRepository(db))
	if err := grapeService.SeedDefaults(ctx, domaingrape.DefaultCatalog()); err != nil {
		return fmt.Errorf("seed grape catalog: %w", err)
	}

	return nil
}

func RequireMigrated(ctx context.Context, db *gorm.DB) error {
	if !db.Migrator().HasTable(&auth.AdminUser{}) || !db.Migrator().HasTable(&domaingrape.Item{}) {
		return ErrDatabaseNotMigrated
	}

	var count int64
	if err := db.WithContext(ctx).Model(&domaingrape.Item{}).Count(&count).Error; err != nil {
		return fmt.Errorf("check grape items: %w", err)
	}
	if count == 0 {
		return ErrDatabaseNotMigrated
	}

	return nil
}
