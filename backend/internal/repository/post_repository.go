package repository

import (
	"context"
	"errors"

	"fukunishifarm/backend/internal/model"
	"gorm.io/gorm"
)

var ErrPostNotFound = errors.New("post not found")

type PostRepository interface {
	ListPublished(ctx context.Context, page, limit int) ([]model.Post, int64, error)
	GetPublishedBySlug(ctx context.Context, slug string) (*model.Post, error)
}

type GormPostRepository struct {
	db *gorm.DB
}

func NewGormPostRepository(db *gorm.DB) *GormPostRepository {
	return &GormPostRepository{db: db}
}

func (r *GormPostRepository) ListPublished(ctx context.Context, page, limit int) ([]model.Post, int64, error) {
	query := r.db.WithContext(ctx).Model(&model.Post{}).Where("published = ?", true)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	var posts []model.Post
	if err := query.
		Order("published_at DESC NULLS LAST, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error; err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

func (r *GormPostRepository) GetPublishedBySlug(ctx context.Context, slug string) (*model.Post, error) {
	var post model.Post
	err := r.db.WithContext(ctx).
		Where("slug = ? AND published = ?", slug, true).
		First(&post).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPostNotFound
	}
	if err != nil {
		return nil, err
	}

	return &post, nil
}
