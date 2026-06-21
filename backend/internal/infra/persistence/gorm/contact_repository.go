package gormrepo

import (
	"context"
	"errors"

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

func (r *ContactRepository) ListMessages(ctx context.Context) ([]domaincontact.Message, error) {
	var messages []domaincontact.Message
	tx := r.db.WithContext(ctx).Order("created_at DESC").Find(&messages)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return messages, nil
}

func (r *ContactRepository) GetMessage(ctx context.Context, id uint) (domaincontact.Message, error) {
	var message domaincontact.Message
	tx := r.db.WithContext(ctx).First(&message, id)
	if tx.Error != nil {
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			return domaincontact.Message{}, domaincontact.ErrMessageNotFound
		}

		return domaincontact.Message{}, tx.Error
	}

	return message, nil
}

func (r *ContactRepository) GetMessageByThreadID(ctx context.Context, threadID string) (domaincontact.Message, error) {
	var message domaincontact.Message
	tx := r.db.WithContext(ctx).Where("thread_id = ?", threadID).First(&message)
	if tx.Error != nil {
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			return domaincontact.Message{}, domaincontact.ErrMessageNotFound
		}

		return domaincontact.Message{}, tx.Error
	}

	return message, nil
}

func (r *ContactRepository) CreateReply(ctx context.Context, reply domaincontact.Reply) (domaincontact.Reply, error) {
	tx := r.db.WithContext(ctx).Create(&reply)
	if tx.Error != nil {
		return domaincontact.Reply{}, tx.Error
	}

	return reply, nil
}

func (r *ContactRepository) ListReplies(ctx context.Context, messageID uint) ([]domaincontact.Reply, error) {
	var replies []domaincontact.Reply
	tx := r.db.WithContext(ctx).Where("message_id = ?", messageID).Order("created_at ASC").Find(&replies)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return replies, nil
}

func (r *ContactRepository) UpdateMessageStatus(ctx context.Context, id uint, status string) error {
	tx := r.db.WithContext(ctx).Model(&domaincontact.Message{}).Where("id = ?", id).Update("status", status)
	if tx.Error != nil {
		return tx.Error
	}
	if tx.RowsAffected == 0 {
		return domaincontact.ErrMessageNotFound
	}
	return nil
}

