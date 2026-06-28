package bootstrap

import (
	"context"
	"errors"
	"fmt"
	"time"

	"fukunishifarm/backend/internal/domain/auth"
	domaincontact "fukunishifarm/backend/internal/domain/contact"
	domaingrape "fukunishifarm/backend/internal/domain/grape"
	domainnews "fukunishifarm/backend/internal/domain/news"
	gormrepo "fukunishifarm/backend/internal/infra/persistence/gorm"
	usecasegrape "fukunishifarm/backend/internal/usecase/grape"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrDatabaseNotMigrated = errors.New("database not migrated")

const contactThreadBackfillBatchSize = 100

func MigrateAndSeed(ctx context.Context, db *gorm.DB) error {
	if err := db.AutoMigrate(&auth.AdminUser{}, &domaingrape.Item{}, &domainnews.Item{}, &contactMessageSchemaV2{}, &contactReplySchemaV2{}); err != nil {
		return fmt.Errorf("auto migrate: %w", err)
	}

	if db.Migrator().HasColumn(&domainnews.Item{}, "Body") {
		if err := db.Migrator().DropColumn(&domainnews.Item{}, "Body"); err != nil {
			return fmt.Errorf("drop news body column: %w", err)
		}
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
	if !db.Migrator().HasTable(&auth.AdminUser{}) || !db.Migrator().HasTable(&domaingrape.Item{}) || !db.Migrator().HasTable(&domainnews.Item{}) || !db.Migrator().HasTable(&domaincontact.Message{}) || !db.Migrator().HasTable(&domaincontact.Reply{}) {
		return ErrDatabaseNotMigrated
	}

	if !db.Migrator().HasColumn(&domaincontact.Message{}, "thread_id") || !db.Migrator().HasColumn(&domaincontact.Reply{}, "thread_id") || !db.Migrator().HasColumn(&domaincontact.Message{}, "status") {
		return ErrDatabaseNotMigrated
	}

	return nil
}

func backfillContactThreadIDs(ctx context.Context, db *gorm.DB) error {
	for {
		messages := make([]domaincontact.Message, 0, contactThreadBackfillBatchSize)
		if err := db.WithContext(ctx).
			Model(&domaincontact.Message{}).
			Select("id").
			Where("thread_id IS NULL OR thread_id = ''").
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
				if err := tx.Model(&domaincontact.Message{}).
					Where("id = ?", message.ID).
					UpdateColumn("thread_id", threadID).Error; err != nil {
					return err
				}

				if err := tx.Model(&domaincontact.Reply{}).
					Where("message_id = ?", message.ID).
					UpdateColumn("thread_id", threadID).Error; err != nil {
					return err
				}
			}

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

type contactMessageSchemaV2 struct {
	ID        uint      `gorm:"primaryKey"`
	ThreadID  string    `gorm:"size:36"`
	Name      string    `gorm:"size:80;not null"`
	Email     string    `gorm:"size:320;not null"`
	Category  string    `gorm:"size:64;not null"`
	Subject   string    `gorm:"size:160;not null"`
	Body      string    `gorm:"type:text;not null"`
	Status    string    `gorm:"size:32;not null;default:'pending'"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (contactMessageSchemaV2) TableName() string {
	return "contact_messages"
}

type contactReplySchemaV2 struct {
	ID           uint      `gorm:"primaryKey"`
	MessageID    uint      `gorm:"not null;index"`
	ThreadID     string    `gorm:"size:36;index"`
	SenderType   string    `gorm:"size:32;not null"`
	SenderUserID uint      `gorm:"not null"`
	SenderName   string    `gorm:"size:255;not null"`
	SenderEmail  string    `gorm:"size:320;not null"`
	Message      string    `gorm:"type:text;not null"`
	CreatedAt    time.Time
}

func (contactReplySchemaV2) TableName() string {
	return "contact_replies"
}
