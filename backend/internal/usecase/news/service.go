package news

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	domainnews "fukunishifarm/backend/internal/domain/news"
	"fukunishifarm/backend/internal/infra/microcms"
)

const defaultEndpoint = "news"
const publicNewsRequestTimeout = 8 * time.Second
const publicNewsCacheTTL = time.Minute

type Service struct {
	client   *microcms.Client
	endpoint string
	mu       sync.RWMutex
	cached   map[string]cachedNewsCatalog
}

type cachedNewsCatalog struct {
	value    domainnews.Catalog
	cachedAt time.Time
	hasValue bool
}

type microCMSListResponse struct {
	Contents   []microCMSNewsItem `json:"contents"`
	TotalCount int                `json:"totalCount"`
	Offset     int                `json:"offset"`
	Limit      int                `json:"limit"`
}

type microCMSNewsItem struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	PublishedAt string `json:"publishedAt"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

func NewService(serviceDomain, apiKey, endpoint string) *Service {
	return &Service{
		client:   microcms.NewClient(serviceDomain, apiKey),
		endpoint: strings.TrimSpace(endpoint),
		cached:   make(map[string]cachedNewsCatalog),
	}
}

func (s *Service) GetPublicCatalog(ctx context.Context, page, limit int) (domainnews.Catalog, error) {
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 5
	} else if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit
	cacheKey := catalogCacheKey(page, limit)

	if catalog, ok := s.getCachedCatalog(cacheKey); ok {
		return catalog, nil
	}

	requestCtx, cancel := context.WithTimeout(ctx, publicNewsRequestTimeout)
	defer cancel()

	var response microCMSListResponse
	if err := s.request(requestCtx, map[string]string{
		"offset": fmt.Sprintf("%d", offset),
		"limit":  fmt.Sprintf("%d", limit),
		"orders": "-publishedAt",
	}, &response); err != nil {
		if cached, ok := s.getAnyCachedCatalog(cacheKey); ok {
			return cached, nil
		}
		return domainnews.Catalog{}, err
	}

	catalog := domainnews.Catalog{
		Items:      toItems(response.Contents, response.Offset),
		TotalCount: response.TotalCount,
		Offset:     response.Offset,
		Limit:      response.Limit,
	}
	s.storeCatalog(cacheKey, catalog)
	return catalog, nil
}

func (s *Service) request(ctx context.Context, query map[string]string, out any) error {
	endpoint := s.endpoint
	if endpoint == "" {
		endpoint = defaultEndpoint
	}

	if err := s.client.Request(ctx, endpoint, http.MethodGet, "", query, nil, out); err != nil {
		return fmt.Errorf("load microcms news: %w", err)
	}

	return nil
}

func toItems(contents []microCMSNewsItem, offset int) []domainnews.Item {
	items := make([]domainnews.Item, 0, len(contents))
	for index, item := range contents {
		items = append(items, domainnews.Item{
			ID:          item.ID,
			Title:       item.Title,
			SortOrder:   offset + index,
			PublishedAt: item.PublishedAt,
			CreatedAt:   item.CreatedAt,
			UpdatedAt:   item.UpdatedAt,
		})
	}
	return items
}

func catalogCacheKey(page, limit int) string {
	return fmt.Sprintf("%d:%d", page, limit)
}

func (s *Service) getCachedCatalog(key string) (domainnews.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.cached[key]
	if !ok || !cached.hasValue || time.Since(cached.cachedAt) > publicNewsCacheTTL {
		return domainnews.Catalog{}, false
	}

	return cached.value, true
}

func (s *Service) getAnyCachedCatalog(key string) (domainnews.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.cached[key]
	if !ok || !cached.hasValue {
		return domainnews.Catalog{}, false
	}

	return cached.value, true
}

func (s *Service) storeCatalog(key string, catalog domainnews.Catalog) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.cached[key] = cachedNewsCatalog{
		value:    catalog,
		cachedAt: time.Now(),
		hasValue: true,
	}
}
