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
	cached   cachedNewsCatalog
}

type cachedNewsCatalog struct {
	value    domainnews.Catalog
	cachedAt time.Time
	hasValue bool
}

type microCMSListResponse struct {
	Contents []microCMSNewsItem `json:"contents"`
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
	}
}

func (s *Service) GetPublicCatalog(ctx context.Context) (domainnews.Catalog, error) {
	if catalog, ok := s.getCachedCatalog(); ok {
		return catalog, nil
	}

	requestCtx, cancel := context.WithTimeout(ctx, publicNewsRequestTimeout)
	defer cancel()

	var response microCMSListResponse
	if err := s.request(requestCtx, map[string]string{
		"limit":  "100",
		"orders": "-publishedAt",
	}, &response); err != nil {
		if cached, ok := s.getAnyCachedCatalog(); ok {
			return cached, nil
		}
		return domainnews.Catalog{}, err
	}

	catalog := domainnews.Catalog{Items: toItems(response.Contents)}
	s.storeCatalog(catalog)
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

func toItems(contents []microCMSNewsItem) []domainnews.Item {
	items := make([]domainnews.Item, 0, len(contents))
	for index, item := range contents {
		items = append(items, domainnews.Item{
			ID:          item.ID,
			Title:       item.Title,
			SortOrder:   index,
			PublishedAt: item.PublishedAt,
			CreatedAt:   item.CreatedAt,
			UpdatedAt:   item.UpdatedAt,
		})
	}
	return items
}

func (s *Service) getCachedCatalog() (domainnews.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if !s.cached.hasValue || time.Since(s.cached.cachedAt) > publicNewsCacheTTL {
		return domainnews.Catalog{}, false
	}

	return s.cached.value, true
}

func (s *Service) getAnyCachedCatalog() (domainnews.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if !s.cached.hasValue {
		return domainnews.Catalog{}, false
	}

	return s.cached.value, true
}

func (s *Service) storeCatalog(catalog domainnews.Catalog) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.cached = cachedNewsCatalog{
		value:    catalog,
		cachedAt: time.Now(),
		hasValue: true,
	}
}
