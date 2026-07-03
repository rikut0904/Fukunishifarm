package blog

import (
	"context"
	"errors"
	"fmt"
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

type Service struct {
	client   *microcms.Client
	endpoint string
	mu       sync.RWMutex
	catalogs map[int]cachedBlogCatalog
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
	Contents []microCMSPost `json:"contents"`
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
		catalogs: make(map[int]cachedBlogCatalog),
		posts:    make(map[string]cachedBlogPost),
	}
}

func (s *Service) GetPublicCatalog(ctx context.Context, limit int) (domainblog.Catalog, error) {
	if limit <= 0 {
		limit = 12
	} else if limit > maxCatalogLimit {
		limit = maxCatalogLimit
	}

	if catalog, ok := s.getCachedCatalog(limit); ok {
		return catalog, nil
	}

	requestCtx, cancel := context.WithTimeout(ctx, publicBlogRequestTimeout)
	defer cancel()

	var response microCMSListResponse
	if err := s.request(requestCtx, http.MethodGet, "", map[string]string{
		"limit":  fmt.Sprintf("%d", limit),
		"orders": "-publishedAt",
	}, &response); err != nil {
		if cached, ok := s.getAnyCachedCatalog(limit); ok {
			return cached, nil
		}
		return domainblog.Catalog{}, err
	}

	catalog := domainblog.Catalog{Posts: toPosts(response.Contents)}
	s.storeCatalog(limit, catalog)
	return catalog, nil
}

func (s *Service) GetPublicPostBySlug(ctx context.Context, slug string) (domainblog.Post, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return domainblog.Post{}, domainblog.ErrInvalidInput
	}

	if post, ok := s.getCachedPost(slug); ok {
		return post, nil
	}

	requestCtx, cancel := context.WithTimeout(ctx, publicBlogRequestTimeout)
	defer cancel()

	var response microCMSListResponse
	if err := s.request(requestCtx, http.MethodGet, "", map[string]string{
		"filters": "slug[equals]" + slug,
		"limit":   "1",
	}, &response); err != nil {
		if cached, ok := s.getAnyCachedPost(slug); ok {
			return cached, nil
		}
		return domainblog.Post{}, err
	}

	if len(response.Contents) == 0 {
		return domainblog.Post{}, domainblog.ErrPostNotFound
	}

	post := toPost(response.Contents[0])
	s.storePost(slug, post)
	return post, nil
}

func (s *Service) request(ctx context.Context, method, path string, query map[string]string, out any) error {
	endpoint := s.endpoint
	if endpoint == "" {
		endpoint = defaultEndpoint
	}

	if err := s.client.Request(ctx, endpoint, method, path, query, nil, out); err != nil {
		var responseError *microcms.ResponseError
		if errors.As(err, &responseError) && responseError.StatusCode == http.StatusNotFound {
			return domainblog.ErrPostNotFound
		}
		return err
	}

	return nil
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
	if strings.TrimSpace(content) == "" {
		content = item.Body
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

func (s *Service) getCachedCatalog(limit int) (domainblog.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.catalogs[limit]
	if !ok || !cached.hasValue || time.Since(cached.cachedAt) > publicBlogCacheTTL {
		return domainblog.Catalog{}, false
	}

	return cached.value, true
}

func (s *Service) getAnyCachedCatalog(limit int) (domainblog.Catalog, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.catalogs[limit]
	if !ok || !cached.hasValue {
		return domainblog.Catalog{}, false
	}

	return cached.value, true
}

func (s *Service) storeCatalog(limit int, catalog domainblog.Catalog) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.catalogs[limit] = cachedBlogCatalog{
		value:    catalog,
		cachedAt: time.Now(),
		hasValue: true,
	}
}

func (s *Service) getCachedPost(slug string) (domainblog.Post, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.posts[slug]
	if !ok || !cached.hasValue || time.Since(cached.cachedAt) > publicBlogCacheTTL {
		return domainblog.Post{}, false
	}

	return cached.value, true
}

func (s *Service) getAnyCachedPost(slug string) (domainblog.Post, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cached, ok := s.posts[slug]
	if !ok || !cached.hasValue {
		return domainblog.Post{}, false
	}

	return cached.value, true
}

func (s *Service) storePost(slug string, post domainblog.Post) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.posts[slug] = cachedBlogPost{
		value:    post,
		cachedAt: time.Now(),
		hasValue: true,
	}
}
