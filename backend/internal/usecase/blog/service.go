package blog

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	domainblog "fukunishifarm/backend/internal/domain/blog"
	"fukunishifarm/backend/internal/infra/microcms"
)

const defaultEndpoint = "blogs"
const maxCatalogLimit = 100
const publicBlogRequestTimeout = 15 * time.Second
const publicBlogCacheTTL = time.Minute
const maxCatalogCacheEntries = 32
const maxPostCacheEntries = 128

type Service struct {
	client   *microcms.Client
	endpoint string
	mu       sync.RWMutex
	catalogs map[string]cachedBlogCatalog
	posts    map[string]cachedBlogPost
}

type cachedBlogCatalog struct {
	value    domainblog.Catalog
	cachedAt time.Time
	hasValue bool
}

type cachedBlogPost struct {
	value    domainblog.Post
	cachedAt time.Time
	hasValue bool
}

type microCMSListResponse struct {
	Contents   []microCMSPost `json:"contents"`
	TotalCount int            `json:"totalCount"`
	Offset     int            `json:"offset"`
	Limit      int            `json:"limit"`
}

type microCMSPost struct {
	ID          string               `json:"id"`
	Title       string               `json:"title"`
	Slug        string               `json:"slug"`
	Excerpt     string               `json:"excerpt"`
	Content     string               `json:"content"`
	Body        string               `json:"body"`
	Eyecatch    *domainblog.Image    `json:"eyecatch"`
	Category    *domainblog.Category `json:"category"`
	PublishedAt string               `json:"publishedAt"`
	RevisedAt   string               `json:"revisedAt"`
	CreatedAt   string               `json:"createdAt"`
	UpdatedAt   string               `json:"updatedAt"`
}

func NewService(serviceDomain, apiKey, endpoint string) *Service {
	return &Service{
		client:   microcms.NewClient(serviceDomain, apiKey),
		endpoint: strings.TrimSpace(endpoint),
		catalogs: make(map[string]cachedBlogCatalog),
		posts:    make(map[string]cachedBlogPost),
	}
}

func (s *Service) GetPublicCatalog(ctx context.Context, page, limit int) (domainblog.Catalog, error) {
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 12
	} else if limit > maxCatalogLimit {
		limit = maxCatalogLimit
	}
	offset := (page - 1) * limit
	cacheKey := catalogCacheKey(page, limit)
	endpoint := s.getEndpoint()

	slog.Info("load public blog catalog", "endpoint", endpoint, "page", page, "limit", limit, "offset", offset)

	if catalog, ok := s.getCachedCatalog(cacheKey); ok {
		slog.Info("serve public blog catalog from cache", "endpoint", endpoint, "page", page, "limit", limit, "count", len(catalog.Posts))
		return catalog, nil
	}

	requestCtx, cancel := context.WithTimeout(ctx, publicBlogRequestTimeout)
	defer cancel()

	var response microCMSListResponse
	if err := s.request(requestCtx, http.MethodGet, "", map[string]string{
		"offset": fmt.Sprintf("%d", offset),
		"limit":  fmt.Sprintf("%d", limit),
		"orders": "-publishedAt",
	}, &response); err != nil {
		slog.Error("load public blog catalog failed", "endpoint", endpoint, "page", page, "limit", limit, "offset", offset, "error", err)
		if cached, ok := s.getAnyCachedCatalog(cacheKey); ok {
			slog.Warn("serve stale public blog catalog from cache after error", "endpoint", endpoint, "page", page, "limit", limit, "count", len(cached.Posts))
			return cached, nil
		}
		return domainblog.Catalog{}, err
	}

	catalog := domainblog.Catalog{
		Posts:      toPosts(response.Contents),
		TotalCount: response.TotalCount,
		Offset:     response.Offset,
		Limit:      response.Limit,
	}
	s.storeCatalog(cacheKey, catalog)
	if catalog.TotalCount == 0 || len(catalog.Posts) == 0 {
		slog.Info("microcms blog catalog is empty", "endpoint", endpoint, "page", page, "limit", limit, "total", catalog.TotalCount)
		return catalog, nil
	}

	slog.Info("loaded public blog catalog", "endpoint", endpoint, "page", page, "limit", limit, "count", len(catalog.Posts), "total", catalog.TotalCount)
	return catalog, nil
}

func (s *Service) GetPublicPostByID(ctx context.Context, id string) (domainblog.Post, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return domainblog.Post{}, domainblog.ErrInvalidInput
	}

	endpoint := s.getEndpoint()
	slog.Info("load public blog post", "endpoint", endpoint, "id", id)

	if post, ok := s.getCachedPost(id); ok {
		slog.Info("serve public blog post from cache", "endpoint", endpoint, "id", id, "title", post.Title)
		return post, nil
	}

	requestCtx, cancel := context.WithTimeout(ctx, publicBlogRequestTimeout)
	defer cancel()

	var response microCMSListResponse
	if err := s.request(requestCtx, http.MethodGet, "", map[string]string{
		"ids":   id,
		"limit": "1",
	}, &response); err != nil {
		if errors.Is(err, domainblog.ErrPostNotFound) {
			slog.Warn("public blog post not found", "endpoint", endpoint, "id", id)
		} else {
			slog.Error("load public blog post failed", "endpoint", endpoint, "id", id, "error", err)
		}
		if cached, ok := s.getAnyCachedPost(id); ok {
			slog.Warn("serve stale public blog post from cache after error", "endpoint", endpoint, "id", id, "title", cached.Title)
			return cached, nil
		}
		return domainblog.Post{}, err
	}

	if len(response.Contents) == 0 {
		slog.Warn("public blog post not found", "endpoint", endpoint, "id", id)
		return domainblog.Post{}, domainblog.ErrPostNotFound
	}

	post := toPost(response.Contents[0])
	s.storePost(id, post)
	slog.Info("loaded public blog post", "endpoint", endpoint, "id", id, "title", post.Title)
	return post, nil
}

func (s *Service) request(ctx context.Context, method, path string, query map[string]string, out any) error {
	endpoint := s.getEndpoint()

	if err := s.client.Request(ctx, endpoint, method, path, query, nil, out); err != nil {
		var responseError *microcms.ResponseError
		if errors.As(err, &responseError) && responseError.StatusCode == http.StatusNotFound {
			return domainblog.ErrPostNotFound
		}
		return err
	}

	return nil
}

func (s *Service) getEndpoint() string {
	endpoint := s.endpoint
	if endpoint == "" {
		endpoint = defaultEndpoint
	}

	return endpoint
}

func toPosts(contents []microCMSPost) []domainblog.Post {
	posts := make([]domainblog.Post, 0, len(contents))
	for _, item := range contents {
		posts = append(posts, toPost(item))
	}
	return posts
}

func toPost(item microCMSPost) domainblog.Post {
	content := item.Content
	body := item.Body
	if strings.TrimSpace(content) == "" {
		content = body
	}

	return domainblog.Post{
		ID:          item.ID,
		Title:       item.Title,
		Slug:        item.Slug,
		Excerpt:     item.Excerpt,
		Content:     content,
		Eyecatch:    item.Eyecatch,
		Category:    item.Category,
		PublishedAt: item.PublishedAt,
		RevisedAt:   item.RevisedAt,
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}
}

func catalogCacheKey(page, limit int) string {
	return fmt.Sprintf("%d:%d", page, limit)
}

func (s *Service) getCachedCatalog(key string) (domainblog.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.catalogs[key]
	if !ok || !cached.hasValue || time.Since(cached.cachedAt) > publicBlogCacheTTL {
		return domainblog.Catalog{}, false
	}

	return cached.value, true
}

func (s *Service) getAnyCachedCatalog(key string) (domainblog.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.catalogs[key]
	if !ok || !cached.hasValue {
		return domainblog.Catalog{}, false
	}

	return cached.value, true
}

func (s *Service) storeCatalog(key string, catalog domainblog.Catalog) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.evictExpiredCatalogsLocked(time.Now())
	s.evictOldestCatalogsLocked(maxCatalogCacheEntries - 1)

	s.catalogs[key] = cachedBlogCatalog{
		value:    catalog,
		cachedAt: time.Now(),
		hasValue: true,
	}
}

func (s *Service) getCachedPost(id string) (domainblog.Post, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.posts[id]
	if !ok || !cached.hasValue || time.Since(cached.cachedAt) > publicBlogCacheTTL {
		return domainblog.Post{}, false
	}

	return cached.value, true
}

func (s *Service) getAnyCachedPost(id string) (domainblog.Post, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.posts[id]
	if !ok || !cached.hasValue {
		return domainblog.Post{}, false
	}

	return cached.value, true
}

func (s *Service) storePost(id string, post domainblog.Post) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.evictExpiredPostsLocked(time.Now())
	s.evictOldestPostsLocked(maxPostCacheEntries - 1)

	s.posts[id] = cachedBlogPost{
		value:    post,
		cachedAt: time.Now(),
		hasValue: true,
	}
}

func (s *Service) evictExpiredCatalogsLocked(now time.Time) {
	for key, cached := range s.catalogs {
		if !cached.hasValue || now.Sub(cached.cachedAt) > publicBlogCacheTTL {
			delete(s.catalogs, key)
		}
	}
}

func (s *Service) evictOldestCatalogsLocked(targetSize int) {
	for len(s.catalogs) > targetSize {
		oldestKey := ""
		var oldestTime time.Time
		for key, cached := range s.catalogs {
			if oldestKey == "" || cached.cachedAt.Before(oldestTime) {
				oldestKey = key
				oldestTime = cached.cachedAt
			}
		}
		if oldestKey == "" {
			return
		}
		delete(s.catalogs, oldestKey)
	}
}

func (s *Service) evictExpiredPostsLocked(now time.Time) {
	for key, cached := range s.posts {
		if !cached.hasValue || now.Sub(cached.cachedAt) > publicBlogCacheTTL {
			delete(s.posts, key)
		}
	}
}

func (s *Service) evictOldestPostsLocked(targetSize int) {
	for len(s.posts) > targetSize {
		oldestKey := ""
		var oldestTime time.Time
		for key, cached := range s.posts {
			if oldestKey == "" || cached.cachedAt.Before(oldestTime) {
				oldestKey = key
				oldestTime = cached.cachedAt
			}
		}
		if oldestKey == "" {
			return
		}
		delete(s.posts, oldestKey)
	}
}
