package news

import (
	"context"
	"fmt"
	"strings"

	domainnews "fukunishifarm/backend/internal/domain/news"
)

type Service struct {
	repository domainnews.Repository
}

func NewService(repository domainnews.Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) GetPublicCatalog(ctx context.Context) (domainnews.Catalog, error) {
	return s.getCatalog(ctx)
}

func (s *Service) GetAdminCatalog(ctx context.Context) (domainnews.Catalog, error) {
	return s.getCatalog(ctx)
}

func (s *Service) ReplaceCatalog(ctx context.Context, catalog domainnews.Catalog) (domainnews.Catalog, error) {
	items, err := normalizeItems(catalog.Items)
	if err != nil {
		return domainnews.Catalog{}, err
	}

	if err := s.repository.ReplaceItems(ctx, items); err != nil {
		return domainnews.Catalog{}, fmt.Errorf("replace news items: %w", err)
	}

	return s.getCatalog(ctx)
}

func (s *Service) CreateItem(ctx context.Context, item domainnews.Item) (domainnews.Item, error) {
	normalized, err := normalizeItem(item)
	if err != nil {
		return domainnews.Item{}, err
	}

	saved, err := s.repository.CreateItem(ctx, normalized)
	if err != nil {
		return domainnews.Item{}, fmt.Errorf("create news item: %w", err)
	}

	return saved, nil
}

func (s *Service) UpdateItem(ctx context.Context, item domainnews.Item) (domainnews.Item, error) {
	normalized, err := normalizeItem(item)
	if err != nil {
		return domainnews.Item{}, err
	}

	saved, err := s.repository.UpdateItem(ctx, normalized)
	if err != nil {
		return domainnews.Item{}, fmt.Errorf("update news item: %w", err)
	}

	return saved, nil
}

func (s *Service) DeleteItem(ctx context.Context, id uint) error {
	if err := s.repository.DeleteItem(ctx, id); err != nil {
		return fmt.Errorf("delete news item: %w", err)
	}

	return nil
}

func (s *Service) getCatalog(ctx context.Context) (domainnews.Catalog, error) {
	items, err := s.repository.ListItems(ctx)
	if err != nil {
		return domainnews.Catalog{}, fmt.Errorf("list news items: %w", err)
	}

	return domainnews.Catalog{Items: items}, nil
}

func normalizeItems(items []domainnews.Item) ([]domainnews.Item, error) {
	normalized := make([]domainnews.Item, 0, len(items))
	for index, item := range items {
		item.SortOrder = index
		normalizedItem, err := normalizeItem(item)
		if err != nil {
			return nil, err
		}

		normalized = append(normalized, normalizedItem)
	}

	return normalized, nil
}

func normalizeItem(item domainnews.Item) (domainnews.Item, error) {
	item.Date = strings.TrimSpace(item.Date)
	item.Title = strings.TrimSpace(item.Title)
	item.Body = ""

	if item.Date == "" || item.Title == "" {
		return domainnews.Item{}, domainnews.ErrInvalidInput
	}

	return item, nil
}
