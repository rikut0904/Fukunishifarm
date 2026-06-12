package gormrepo

import (
	"context"

	domaingrape "fukunishifarm/backend/internal/domain/grape"
	"gorm.io/gorm"
)

type GrapeRepository struct {
	db *gorm.DB
}

func NewGrapeRepository(db *gorm.DB) *GrapeRepository {
	return &GrapeRepository{db: db}
}

func (r *GrapeRepository) ListItems(ctx context.Context) ([]domaingrape.Item, error) {
	var items []domaingrape.Item
	tx := r.db.WithContext(ctx).Order("sort_order ASC").Find(&items)
	if tx.Error != nil {
		return nil, tx.Error
	}
	return items, nil
}

func (r *GrapeRepository) ReplaceItems(ctx context.Context, items []domaingrape.Item) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&domaingrape.Item{}).Error; err != nil {
			return err
		}

		if len(items) == 0 {
			return nil
		}

		normalized := make([]domaingrape.Item, 0, len(items))
		for index, item := range items {
			item.ID = 0
			item.SortOrder = index
			normalized = append(normalized, item)
		}

		return tx.Create(&normalized).Error
	})
}

func (r *GrapeRepository) CreateItem(ctx context.Context, item domaingrape.Item) (domaingrape.Item, error) {
	tx := r.db.WithContext(ctx).Create(&item)
	if tx.Error != nil {
		return domaingrape.Item{}, tx.Error
	}
	return item, nil
}

func (r *GrapeRepository) UpdateItem(ctx context.Context, item domaingrape.Item) (domaingrape.Item, error) {
	updates := map[string]any{
		"name":         item.Name,
		"description":  item.Description,
		"is_on_sale":   item.IsOnSale,
		"image_path":   item.ImagePath,
		"image_focus":  item.ImageFocus,
		"image_scale":  item.ImageScale,
		"sort_order":   item.SortOrder,
	}

	tx := r.db.WithContext(ctx).Model(&domaingrape.Item{}).Where("id = ?", item.ID).Updates(updates)
	if tx.Error != nil {
		return domaingrape.Item{}, tx.Error
	}
	if tx.RowsAffected == 0 {
		return domaingrape.Item{}, domaingrape.ErrItemNotFound
	}

	var saved domaingrape.Item
	if err := r.db.WithContext(ctx).First(&saved, item.ID).Error; err != nil {
		return domaingrape.Item{}, err
	}

	return saved, nil
}

func (r *GrapeRepository) DeleteItem(ctx context.Context, id uint) error {
	tx := r.db.WithContext(ctx).Delete(&domaingrape.Item{}, id)
	if tx.Error != nil {
		return tx.Error
	}
	if tx.RowsAffected == 0 {
		return domaingrape.ErrItemNotFound
	}
	return nil
}
