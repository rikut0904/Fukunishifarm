package blog

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	domainblog "fukunishifarm/backend/internal/domain/blog"
)

const defaultEndpoint = "blogs"

type Service struct {
	serviceDomain string
	apiKey        string
	endpoint      string
	httpClient    *http.Client
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

type PostInput struct {
	Title   string
	Slug    string
	Excerpt string
	Content string
}

func NewService(serviceDomain, apiKey, endpoint string) *Service {
	return &Service{
		serviceDomain: normalizeServiceDomain(serviceDomain),
		apiKey:        strings.TrimSpace(apiKey),
		endpoint:      strings.TrimSpace(endpoint),
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (s *Service) IsConfigured() bool {
	return s.serviceDomain != "" && s.apiKey != ""
}

func (s *Service) GetPublicCatalog(ctx context.Context, limit int) (domainblog.Catalog, error) {
	if limit <= 0 {
		limit = 12
	}

	var response microCMSListResponse
	if err := s.request(ctx, http.MethodGet, "", map[string]string{
		"limit":  fmt.Sprintf("%d", limit),
		"orders": "-publishedAt",
	}, nil, &response); err != nil {
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
	}, nil, &response); err != nil {
		return domainblog.Post{}, err
	}

	if len(response.Contents) == 0 {
		var post microCMSPost
		if err := s.request(ctx, http.MethodGet, "/"+url.PathEscape(slug), nil, nil, &post); err != nil {
			return domainblog.Post{}, err
		}
		return toPost(post), nil
	}

	return toPost(response.Contents[0]), nil
}

func (s *Service) request(ctx context.Context, method, path string, query map[string]string, body any, out any) error {
	if !s.IsConfigured() {
		return fmt.Errorf("microcms blog service is not configured")
	}

	endpoint := s.endpoint
	if endpoint == "" {
		endpoint = defaultEndpoint
	}

	requestURL := url.URL{
		Scheme: "https",
		Host:   s.serviceDomain + ".microcms.io",
		Path:   "/api/v1/" + endpoint + path,
	}
	values := requestURL.Query()
	for key, value := range query {
		if strings.TrimSpace(value) != "" {
			values.Set(key, value)
		}
	}
	requestURL.RawQuery = values.Encode()

	var bodyReader *bytes.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal microcms request: %w", err)
		}
		bodyReader = bytes.NewReader(payload)
	} else {
		bodyReader = bytes.NewReader(nil)
	}

	req, err := http.NewRequestWithContext(ctx, method, requestURL.String(), bodyReader)
	if err != nil {
		return fmt.Errorf("build microcms request: %w", err)
	}
	req.Header.Set("X-MICROCMS-API-KEY", s.apiKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("microcms request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return domainblog.ErrPostNotFound
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("microcms request failed: %s", resp.Status)
	}
	if out == nil || resp.StatusCode == http.StatusNoContent {
		return nil
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return fmt.Errorf("decode microcms response: %w", err)
	}
	return nil
}

func normalizeServiceDomain(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}

	if strings.HasPrefix(value, "http://") || strings.HasPrefix(value, "https://") {
		if parsed, err := url.Parse(value); err == nil {
			value = parsed.Host
		}
	}

	value = strings.TrimPrefix(value, "https://")
	value = strings.TrimPrefix(value, "http://")
	value = strings.TrimSuffix(value, "/")
	value = strings.TrimPrefix(value, "www.")
	value = strings.TrimSuffix(value, ".microcms.io")
	if index := strings.Index(value, "/"); index >= 0 {
		value = value[:index]
	}

	return strings.TrimSpace(value)
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
