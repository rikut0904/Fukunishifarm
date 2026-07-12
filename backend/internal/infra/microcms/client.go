package microcms

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type ResponseError struct {
	StatusCode int
	Status     string
	Body       string
}

var (
	ErrUnauthorized  = errors.New("microcms unauthorized")
	ErrNotConfigured = errors.New("microcms not configured")
)

func (e *ResponseError) Error() string {
	if strings.TrimSpace(e.Body) != "" {
		return fmt.Sprintf("microcms request failed: %s: %s", e.Status, e.Body)
	}
	return fmt.Sprintf("microcms request failed: %s", e.Status)
}

type Client struct {
	serviceDomain string
	apiKey        string
	httpClient    *http.Client
}

const defaultHTTPTimeout = 15 * time.Second

func NewClient(serviceDomain, apiKey string) *Client {
	return &Client{
		serviceDomain: normalizeServiceDomain(serviceDomain),
		apiKey:        strings.TrimSpace(apiKey),
		httpClient: &http.Client{
			Timeout: defaultHTTPTimeout,
		},
	}
}

func (c *Client) IsConfigured() bool {
	return c.serviceDomain != "" && c.apiKey != ""
}

func (c *Client) Request(ctx context.Context, endpoint, method, path string, query map[string]string, body any, out any) error {
	if !c.IsConfigured() {
		return ErrNotConfigured
	}

	basePath := normalizeEndpointPath(endpoint)
	requestURL := url.URL{
		Scheme: "https",
		Host:   c.serviceDomain + ".microcms.io",
		Path:   basePath,
	}
	if path != "" {
		parsedPath, err := url.Parse(normalizeRequestPath(path))
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

	httpClient := c.httpClient
	if httpClient == nil {
		httpClient = &http.Client{
			Timeout: defaultHTTPTimeout,
		}
	}

	slog.Info("microcms request", "method", method, "url", requestURL.String(), "endpoint", endpoint)

	resp, err := httpClient.Do(req)
	if err != nil {
		slog.Error("microcms request transport failed", "method", method, "url", requestURL.String(), "endpoint", endpoint, "error", err)
		return fmt.Errorf("microcms request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		logAttrs := []any{"method", method, "url", requestURL.String(), "endpoint", endpoint, "status_code", resp.StatusCode, "status", resp.Status, "body", strings.TrimSpace(string(body))}
		if resp.StatusCode >= http.StatusInternalServerError {
			slog.Error("microcms request returned non-success status", logAttrs...)
		} else {
			slog.Warn("microcms request returned non-success status", logAttrs...)
		}
		responseErr := &ResponseError{
			StatusCode: resp.StatusCode,
			Status:     resp.Status,
			Body:       strings.TrimSpace(string(body)),
		}
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return fmt.Errorf("%w: %w", ErrUnauthorized, responseErr)
		}
		return responseErr
	}

	slog.Info("microcms request completed", "method", method, "url", requestURL.String(), "endpoint", endpoint, "status_code", resp.StatusCode)
	if out == nil || resp.StatusCode == http.StatusNoContent {
		return nil
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		slog.Error("decode microcms response failed", "method", method, "url", requestURL.String(), "endpoint", endpoint, "error", err)
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

func normalizeEndpointPath(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "/api/v1"
	}

	if strings.HasPrefix(value, "http://") || strings.HasPrefix(value, "https://") {
		if parsed, err := url.Parse(value); err == nil {
			value = parsed.Path
		}
	}

	value = strings.TrimPrefix(value, "https://")
	value = strings.TrimPrefix(value, "http://")
	if index := strings.Index(value, "/"); index >= 0 {
		value = value[index:]
	}

	value = "/" + strings.TrimLeft(value, "/")
	if strings.HasPrefix(value, "/api/v1/") {
		return strings.TrimRight(value, "/")
	}
	if value == "/api/v1" {
		return value
	}

	return "/api/v1/" + strings.Trim(value, "/")
}

func normalizeRequestPath(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if strings.HasPrefix(value, "/") || strings.HasPrefix(value, "?") || strings.HasPrefix(value, "#") {
		return value
	}

	return "/" + value
}
