package config

import (
	"os"
	"strings"
)

type Config struct {
	DatabaseURL      string
	CORSAllowOrigins []string
}

func Load() Config {
	return Config{
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		CORSAllowOrigins: parseCSV(getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000")),
	}
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
