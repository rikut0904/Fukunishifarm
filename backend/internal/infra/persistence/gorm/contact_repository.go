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

func (r *ContactRepository) ListMessages(ctx context.Context, status string, offset, limit int) ([]domaincontact.Message, int64, error) {
	var messages []domaincontact.Message
	var total int64

	query := r.db.WithContext(ctx).Model(&domaincontact.Message{})
	if status != "" && status != "all" {
		if status == "unresolved" {
			query = query.Where("status = ? OR status = ?", "pending", "in_progress")
		} else {
			query = query.Where("status = ?", status)
		}
	}

	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	tx := query.Order("created_at DESC")
	if limit > 0 {
		tx = tx.Limit(limit)
	}
	if offset > 0 {
		tx = tx.Offset(offset)
	}

	if err := tx.Find(&messages).Error; err != nil {
		return nil, 0, err
	}

	return messages, total, nil
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
	if reply.Status == "" {
		reply.Status = "sent"
	}
	tx := r.db.WithContext(ctx).Create(&reply)
	if tx.Error != nil {
		return domaincontact.Reply{}, tx.Error
	}

	return reply, nil
}

func (r *ContactRepository) UpdateReplyStatus(ctx context.Context, id uint, status string) error {
	tx := r.db.WithContext(ctx).Model(&domaincontact.Reply{}).Where("id = ?", id).Update("status", status)
	if tx.Error != nil {
		return tx.Error
	}
	if tx.RowsAffected == 0 {
		return domaincontact.ErrReplyNotFound
	}
	return nil
}

func (r *ContactRepository) CreateReplyAndUpdateMessageStatus(ctx context.Context, reply domaincontact.Reply, status string) (domaincontact.Reply, error) {
	var saved domaincontact.Reply
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if reply.Status == "" {
			reply.Status = "sent"
		}
		if err := tx.Create(&reply).Error; err != nil {
			return err
		}

		if err := tx.Model(&domaincontact.Message{}).Where("id = ?", reply.MessageID).Update("status", status).Error; err != nil {
			return err
		}

		saved = reply
		return nil
	})
	if err != nil {
		return domaincontact.Reply{}, err
	}

	return saved, nil
}

func (r *ContactRepository) ListReplies(ctx context.Context, messageID uint) ([]domaincontact.Reply, error) {
	var replies []domaincontact.Reply
	tx := r.db.WithContext(ctx).Where("message_id = ? AND status = ?", messageID, "sent").Order("created_at ASC").Find(&replies)
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
