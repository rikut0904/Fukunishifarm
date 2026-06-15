package gormrepo

import (
	"context"
	"errors"

	domainnews "fukunishifarm/backend/internal/domain/news"
	"gorm.io/gorm"
)

type NewsRepository struct {
	db *gorm.DB
}

func NewNewsRepository(db *gorm.DB) *NewsRepository {
	return &NewsRepository{db: db}
}

func (r *NewsRepository) ListItems(ctx context.Context) ([]domainnews.Item, error) {
	var items []domainnews.Item
	tx := r.db.WithContext(ctx).Order("sort_order ASC").Find(&items)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return items, nil
}

func (r *NewsRepository) ReplaceItems(ctx context.Context, items []domainnews.Item) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&domainnews.Item{}).Error; err != nil {
			return err
		}

		if len(items) == 0 {
			return nil
		}

		normalized := make([]domainnews.Item, 0, len(items))
		for index, item := range items {
			item.ID = 0
			item.SortOrder = index
			normalized = append(normalized, item)
		}

		return tx.Create(&normalized).Error
	})
}

func (r *NewsRepository) CreateItem(ctx context.Context, item domainnews.Item) (domainnews.Item, error) {
	tx := r.db.WithContext(ctx).Create(&item)
	if tx.Error != nil {
		return domainnews.Item{}, tx.Error
	}

	return item, nil
}

func (r *NewsRepository) UpdateItem(ctx context.Context, item domainnews.Item) (domainnews.Item, error) {
	returnItem := domainnews.Item{}
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing domainnews.Item
		if err := tx.First(&existing, item.ID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return domainnews.ErrItemNotFound
			}
			return err
		}

		existing.Date = item.Date
		existing.Title = item.Title
		existing.SortOrder = item.SortOrder

		if err := tx.Save(&existing).Error; err != nil {
			return err
		}

		returnItem = existing
		return nil
	})
	if err != nil {
		return domainnews.Item{}, err
	}

	return returnItem, nil
}

func (r *NewsRepository) DeleteItem(ctx context.Context, id uint) error {
	tx := r.db.WithContext(ctx).Delete(&domainnews.Item{}, id)
	if tx.Error != nil {
		return tx.Error
	}

	if tx.RowsAffected == 0 {
		return domainnews.ErrItemNotFound
	}

	return nil
}

func (r *NewsRepository) ReorderItems(ctx context.Context, items []domainnews.Item) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		ids := make([]uint, 0, len(items))
		for _, item := range items {
			if item.ID == 0 {
				continue
			}

			ids = append(ids, item.ID)
		}

		if len(ids) == 0 {
			return nil
		}

		var existingIDs []uint
		if err := tx.Model(&domainnews.Item{}).Where("id IN ?", ids).Pluck("id", &existingIDs).Error; err != nil {
			return err
		}

		if len(existingIDs) != len(ids) {
			return domainnews.ErrItemNotFound
		}

		for _, item := range items {
			if item.ID == 0 {
				continue
			}

			if err := tx.Model(&domainnews.Item{}).
				Where("id = ?", item.ID).
				Update("sort_order", item.SortOrder).Error; err != nil {
				return err
			}
		}

		return nil
	})
}
