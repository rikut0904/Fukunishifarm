package config

import (
	"encoding/json"
	"os"
	"strings"
)

type Config struct {
	Port                   string
	DatabaseURL            string
	CORSAllowOrigins       []string
	SiteBaseURL            string
	MicroCMSServiceDomain  string
	MicroCMSAPIKey         string
	MicroCMSBlogEndpoint   string
	MicroCMSNewsEndpoint   string
	AWSRegion              string
	AWSAccessKeyID         string
	AWSSecretAccessKey     string
	AWSSessionToken        string
	SESFromEmail           string
	FirebaseProjectID      string
	FirebaseServiceAccount string
	FirebaseWebAPIKey      string
	SessionJWTSecret       string
}

func Load() Config {
	loadDotEnvFiles(".env", "backend/.env")

	serviceAccountJSON := os.Getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
	firebaseProjectID := strings.TrimSpace(os.Getenv("FIREBASE_PROJECT_ID"))
	if resolved := resolveFirebaseProjectID(firebaseProjectID, serviceAccountJSON); resolved != "" {
		firebaseProjectID = resolved
	}

	return Config{
		Port:                   getenv("PORT", "8080"),
		DatabaseURL:            os.Getenv("DATABASE_URL"),
		CORSAllowOrigins:       parseCSV(getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000")),
		SiteBaseURL:            strings.TrimRight(strings.TrimSpace(os.Getenv("SITE_BASE_URL")), "/"),
		MicroCMSServiceDomain:  strings.TrimSpace(os.Getenv("MICROCMS_SERVICE_DOMAIN")),
		MicroCMSAPIKey:         strings.TrimSpace(getenvAny("MICROCMS_WRITE_API_KEY", "MICROCMS_API_KEY")),
		MicroCMSBlogEndpoint:   strings.TrimSpace(os.Getenv("MICROCMS_BLOG_ENDPOINT")),
		MicroCMSNewsEndpoint:   strings.TrimSpace(os.Getenv("MICROCMS_NEWS_ENDPOINT")),
		AWSRegion:              strings.TrimSpace(os.Getenv("AWS_REGION")),
		AWSAccessKeyID:         strings.TrimSpace(os.Getenv("AWS_ACCESS_KEY_ID")),
		AWSSecretAccessKey:     strings.TrimSpace(os.Getenv("AWS_SECRET_ACCESS_KEY")),
		AWSSessionToken:        strings.TrimSpace(os.Getenv("AWS_SESSION_TOKEN")),
		SESFromEmail:           strings.TrimSpace(os.Getenv("SES_FROM_EMAIL")),
		FirebaseProjectID:      firebaseProjectID,
		FirebaseServiceAccount: serviceAccountJSON,
		FirebaseWebAPIKey:      getenvAny("FIREBASE_WEB_API_KEY", "FIREBASE_API_KEY"),
		SessionJWTSecret:       os.Getenv("SESSION_JWT_SECRET"),
	}
}

func resolveFirebaseProjectID(envProjectID, serviceAccountJSON string) string {
	if envProjectID != "" && !isNumeric(envProjectID) {
		return envProjectID
	}
	if serviceAccountJSON == "" {
		return envProjectID
	}

	var decoded struct {
		ProjectID string `json:"project_id"`
	}
	if err := json.Unmarshal([]byte(serviceAccountJSON), &decoded); err != nil {
		return envProjectID
	}
	if decoded.ProjectID != "" {
		return decoded.ProjectID
	}
	return envProjectID
}

func isNumeric(value string) bool {
	if value == "" {
		return false
	}
	for _, r := range value {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func loadDotEnvFiles(paths ...string) {
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}

		for _, line := range strings.Split(string(data), "\n") {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			if strings.HasPrefix(line, "export ") {
				line = strings.TrimSpace(strings.TrimPrefix(line, "export "))
			}

			key, value, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}

			key = strings.TrimSpace(key)
			value = strings.TrimSpace(value)
			value = trimMatchingQuotes(value)
			if key == "" {
				continue
			}

			if _, exists := os.LookupEnv(key); !exists {
				_ = os.Setenv(key, value)
			}
		}
	}
}

func getenvAny(keys ...string) string {
	for _, key := range keys {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return value
		}
	}
	return ""
}

func trimMatchingQuotes(value string) string {
	if len(value) < 2 {
		return value
	}

	if (value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'') {
		return value[1 : len(value)-1]
	}

	return value
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func parseCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value != "" {
			values = append(values, value)
		}
	}
	return values
}
