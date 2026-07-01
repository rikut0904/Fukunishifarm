package microcms

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type ResponseError struct {
	StatusCode int
	Status     string
}

func (e *ResponseError) Error() string {
	return fmt.Sprintf("microcms request failed: %s", e.Status)
}

type Client struct {
	serviceDomain string
	apiKey        string
	httpClient    *http.Client
}

func NewClient(serviceDomain, apiKey string) *Client {
	return &Client{
		serviceDomain: normalizeServiceDomain(serviceDomain),
		apiKey:        strings.TrimSpace(apiKey),
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *Client) IsConfigured() bool {
	return c.serviceDomain != "" && c.apiKey != ""
}

func (c *Client) Request(ctx context.Context, endpoint, method, path string, query map[string]string, body any, out any) error {
	if !c.IsConfigured() {
		return fmt.Errorf("microcms service is not configured")
	}

	basePath := "/api/v1/" + strings.Trim(strings.TrimSpace(endpoint), "/")
	requestURL := url.URL{
		Scheme: "https",
		Host:   c.serviceDomain + ".microcms.io",
		Path:   basePath,
	}
	if path != "" {
		parsedPath, err := url.Parse(path)
		if err != nil {
			return fmt.Errorf("parse microcms request path: %w", err)
		}

		requestURL.Path = basePath + parsedPath.Path
		requestURL.RawPath = basePath + parsedPath.EscapedPath()
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
	req.Header.Set("X-MICROCMS-API-KEY", c.apiKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("microcms request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &ResponseError{
			StatusCode: resp.StatusCode,
			Status:     resp.Status,
		}
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
	if index := strings.Index(value, "/"); index >= 0 {
		value = value[:index]
	}
	value = strings.TrimSuffix(value, ".microcms.io")

	return strings.TrimSpace(value)
}
