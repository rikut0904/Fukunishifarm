package grape

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	domaingrape "fukunishifarm/backend/internal/domain/grape"
)

const publicGrapeRequestTimeout = 8 * time.Second
const publicGrapeCacheTTL = time.Minute

type Service struct {
	repository domaingrape.Repository
	mu         sync.RWMutex
	cached     cachedPublicCatalog
}

type cachedPublicCatalog struct {
	value    domaingrape.Catalog
	cachedAt time.Time
	hasValue bool
}

func NewService(repository domaingrape.Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) GetPublicCatalog(ctx context.Context) (domaingrape.Catalog, error) {
	if catalog, ok := s.getCachedCatalog(); ok {
		return catalog, nil
	}

	requestCtx, cancel := context.WithTimeout(ctx, publicGrapeRequestTimeout)
	defer cancel()

	catalog, err := s.getCatalog(requestCtx)
	if err != nil {
		if cached, ok := s.getAnyCachedCatalog(); ok {
			return cached, nil
		}
		return domaingrape.Catalog{}, err
	}

	s.storeCatalog(catalog)
	return catalog, nil
}

func (s *Service) GetAdminCatalog(ctx context.Context) (domaingrape.Catalog, error) {
	return s.getCatalog(ctx)
}

func (s *Service) ReplaceCatalog(ctx context.Context, catalog domaingrape.Catalog) (domaingrape.Catalog, error) {
	items, err := normalizeItems(catalog.Items)
	if err != nil {
		return domaingrape.Catalog{}, err
	}

	if err := s.repository.ReplaceItems(ctx, items); err != nil {
		return domaingrape.Catalog{}, fmt.Errorf("replace grape items: %w", err)
	}

	return s.getCatalog(ctx)
}

func (s *Service) SaveItem(ctx context.Context, item domaingrape.Item) (domaingrape.Item, error) {
	normalized, err := normalizeItem(item)
	if err != nil {
		return domaingrape.Item{}, err
	}

	if normalized.ID == 0 {
		saved, err := s.repository.CreateItem(ctx, normalized)
		if err != nil {
			return domaingrape.Item{}, fmt.Errorf("create grape item: %w", err)
		}
		return saved, nil
	}

	saved, err := s.repository.UpdateItem(ctx, normalized)
	if err != nil {
		return domaingrape.Item{}, fmt.Errorf("update grape item: %w", err)
	}

	return saved, nil
}

func (s *Service) DeleteItem(ctx context.Context, id uint) error {
	if id == 0 {
		return domaingrape.ErrInvalidInput
	}

	if err := s.repository.DeleteItem(ctx, id); err != nil {
		return fmt.Errorf("delete grape item: %w", err)
	}

	return nil
}

func (s *Service) SeedDefaults(ctx context.Context, defaults domaingrape.Catalog) error {
	items, err := s.repository.ListItems(ctx)
	if err != nil {
		return fmt.Errorf("seed grape items: %w", err)
	}
	if len(items) == 0 && len(defaults.Items) > 0 {
		if err := s.repository.ReplaceItems(ctx, defaults.Items); err != nil {
			return fmt.Errorf("seed grape items: %w", err)
		}
	}

	return nil
}

func (s *Service) getCatalog(ctx context.Context) (domaingrape.Catalog, error) {
	if s.repository == nil {
		return domaingrape.Catalog{}, fmt.Errorf("grape repository is not configured")
	}

	items, err := s.repository.ListItems(ctx)
	if err != nil {
		return domaingrape.Catalog{}, fmt.Errorf("list grape items: %w", err)
	}

	return domaingrape.Catalog{Items: items}, nil
}

func normalizeItems(items []domaingrape.Item) ([]domaingrape.Item, error) {
	normalized := make([]domaingrape.Item, 0, len(items))
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

func normalizeItem(item domaingrape.Item) (domaingrape.Item, error) {
	item.Name = strings.TrimSpace(item.Name)
	item.Description = strings.TrimSpace(item.Description)
	item.ImagePath = strings.TrimSpace(item.ImagePath)
	item.ImageFocus = strings.TrimSpace(item.ImageFocus)
	switch {
	case item.ImageScale <= 0:
		item.ImageScale = 100
	case item.ImageScale < 50:
		item.ImageScale = 50
	case item.ImageScale > 200:
		item.ImageScale = 200
	}

	if item.SortOrder < 0 {
		item.SortOrder = 0
	}

	if item.Name == "" || item.Description == "" || item.ImagePath == "" || item.ImageFocus == "" {
		return domaingrape.Item{}, domaingrape.ErrInvalidInput
	}

	return item, nil
}

func (s *Service) getCachedCatalog() (domaingrape.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if !s.cached.hasValue || time.Since(s.cached.cachedAt) > publicGrapeCacheTTL {
		return domaingrape.Catalog{}, false
	}

	return s.cached.value, true
}

func (s *Service) getAnyCachedCatalog() (domaingrape.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if !s.cached.hasValue {
		return domaingrape.Catalog{}, false
	}

	return s.cached.value, true
}

func (s *Service) storeCatalog(catalog domaingrape.Catalog) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.cached = cachedPublicCatalog{
		value:    catalog,
		cachedAt: time.Now(),
		hasValue: true,
	}
}
