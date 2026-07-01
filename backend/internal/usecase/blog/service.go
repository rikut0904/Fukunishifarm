package blog

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	domainblog "fukunishifarm/backend/internal/domain/blog"
	"fukunishifarm/backend/internal/infra/microcms"
)

const defaultEndpoint = "blogs"

type Service struct {
	client   *microcms.Client
	endpoint string
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
	}
}

func (s *Service) GetPublicCatalog(ctx context.Context, limit int) (domainblog.Catalog, error) {
	if limit <= 0 {
		limit = 12
	}

	var response microCMSListResponse
	if err := s.request(ctx, http.MethodGet, "", map[string]string{
		"limit":  fmt.Sprintf("%d", limit),
		"orders": "-publishedAt",
	}, &response); err != nil {
		return domainblog.Catalog{}, err
	}

	return domainblog.Catalog{Posts: toPosts(response.Contents)}, nil
}

func (s *Service) GetPublicPostBySlug(ctx context.Context, slug string) (domainblog.Post, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return domainblog.Post{}, domainblog.ErrInvalidInput
	}

	var response microCMSListResponse
	if err := s.request(ctx, http.MethodGet, "", map[string]string{
		"filters": "slug[equals]" + slug,
		"limit":   "1",
	}, &response); err != nil {
		return domainblog.Post{}, err
	}

	if len(response.Contents) == 0 {
		var post microCMSPost
		if err := s.request(ctx, http.MethodGet, "/"+url.PathEscape(slug), nil, &post); err != nil {
			return domainblog.Post{}, err
		}
		return toPost(post), nil
	}

	return toPost(response.Contents[0]), nil
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
	return domainblog.Post{
		ID:          item.ID,
		Title:       item.Title,
		Slug:        item.Slug,
		Excerpt:     item.Excerpt,
		Content:     item.Content,
		Eyecatch:    item.Eyecatch,
		Category:    item.Category,
		PublishedAt: item.PublishedAt,
		RevisedAt:   item.RevisedAt,
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}
}
