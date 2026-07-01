package news

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	domainnews "fukunishifarm/backend/internal/domain/news"
	"fukunishifarm/backend/internal/infra/microcms"
)

const defaultEndpoint = "news"

type Service struct {
	client   *microcms.Client
	endpoint string
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
	var response microCMSListResponse
	if err := s.request(ctx, map[string]string{
		"limit":  "100",
		"orders": "-publishedAt",
	}, &response); err != nil {
		return domainnews.Catalog{}, err
	}

	return domainnews.Catalog{Items: toItems(response.Contents)}, nil
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
