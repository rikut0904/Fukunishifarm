package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	port := getenv("PORT", "8080")

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	e.Use(middleware.CORS())

	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, echo.Map{
			"name":   "fukunishi-farm-api",
			"status": "ok",
		})
	})

	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, echo.Map{
			"status":  "ok",
			"service": "fukunishi-farm-api",
		})
	})

	slog.Info("starting api server", "port", port)
	if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
		slog.Error("api server exited", "error", err)
		os.Exit(1)
	}
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
