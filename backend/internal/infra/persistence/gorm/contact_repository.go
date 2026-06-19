package gormrepo

import (
	"context"

	domaincontact "fukunishifarm/backend/internal/domain/contact"
	"gorm.io/gorm"
)

type ContactRepository struct {
	db *gorm.DB
}

func NewContactRepository(db *gorm.DB) *ContactRepository {
	return &ContactRepository{db: db}
}

func (r *ContactRepository) CreateMessage(ctx context.Context, message domaincontact.Message) (domaincontact.Message, error) {
	tx := r.db.WithContext(ctx).Create(&message)
	if tx.Error != nil {
		return domaincontact.Message{}, tx.Error
	}

	return message, nil
}
