package bootstrap

import (
	"context"
	"errors"
	"fmt"

	"fukunishifarm/backend/internal/domain/auth"
	domaincontact "fukunishifarm/backend/internal/domain/contact"
	domaingrape "fukunishifarm/backend/internal/domain/grape"
	gormrepo "fukunishifarm/backend/internal/infra/persistence/gorm"
	usecasegrape "fukunishifarm/backend/internal/usecase/grape"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrDatabaseNotMigrated = errors.New("database not migrated")

const contactThreadBackfillBatchSize = 100

func MigrateAndSeed(ctx context.Context, db *gorm.DB) error {
	if err := db.AutoMigrate(&auth.AdminUser{}, &domaingrape.Item{}, &domaincontact.Message{}, &domaincontact.Reply{}); err != nil {
		return fmt.Errorf("auto migrate: %w", err)
	}

	if err := backfillContactThreadIDs(ctx, db); err != nil {
		return fmt.Errorf("backfill contact thread ids: %w", err)
	}

	if err := ensureContactThreadIDIndex(ctx, db); err != nil {
		return fmt.Errorf("ensure contact thread id index: %w", err)
	}

	grapeService := usecasegrape.NewService(gormrepo.NewGrapeRepository(db))
	if err := grapeService.SeedDefaults(ctx, domaingrape.DefaultCatalog()); err != nil {
		return fmt.Errorf("seed grape catalog: %w", err)
	}

	return nil
}

func RequireMigrated(ctx context.Context, db *gorm.DB) error {
	if !db.Migrator().HasTable(&auth.AdminUser{}) || !db.Migrator().HasTable(&domaingrape.Item{}) || !db.Migrator().HasTable(&domaincontact.Message{}) || !db.Migrator().HasTable(&domaincontact.Reply{}) {
		return ErrDatabaseNotMigrated
	}

	if !db.Migrator().HasColumn(&domaincontact.Message{}, "thread_id") || !db.Migrator().HasColumn(&domaincontact.Reply{}, "thread_id") || !db.Migrator().HasColumn(&domaincontact.Message{}, "status") || !db.Migrator().HasColumn(&domaincontact.Reply{}, "status") {
		return ErrDatabaseNotMigrated
	}

	return nil
}

func backfillContactThreadIDs(ctx context.Context, db *gorm.DB) error {
	var lastID uint
	for {
		messages := make([]domaincontact.Message, 0, contactThreadBackfillBatchSize)
		if err := db.WithContext(ctx).
			Model(&domaincontact.Message{}).
			Select("id").
			Where("thread_id IS NULL OR thread_id = ''").
			Where("id > ?", lastID).
			Order("id ASC").
			Limit(contactThreadBackfillBatchSize).
			Find(&messages).Error; err != nil {
			return err
		}

		if len(messages) == 0 {
			return nil
		}

		if err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			for _, message := range messages {
				threadID := uuid.NewString()

				messageResult := tx.Model(&domaincontact.Message{}).
					Where("id = ? AND (thread_id IS NULL OR thread_id = '')", message.ID).
					UpdateColumn("thread_id", threadID)
				if err := messageResult.Error; err != nil {
					return err
				}
				if messageResult.RowsAffected == 0 {
					continue
				}

				replyResult := tx.Model(&domaincontact.Reply{}).
					Where("message_id = ?", message.ID).
					UpdateColumn("thread_id", threadID)
				if err := replyResult.Error; err != nil {
					return err
				}
			}

			lastID = messages[len(messages)-1].ID
			return nil
		}); err != nil {
			return err
		}
	}
}

func ensureContactThreadIDIndex(ctx context.Context, db *gorm.DB) error {
	return db.WithContext(ctx).Exec(`
		CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_messages_thread_id
		ON contact_messages (thread_id)
		WHERE thread_id IS NOT NULL AND thread_id <> ''
	`).Error
}
