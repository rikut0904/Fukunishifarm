SHELL := /bin/sh

COMPOSE ?= docker compose
FRONTEND_DIR := frontend
BACKEND_DIR := backend

.PHONY: up build test fmt lint ci clean

up:
	$(COMPOSE) up --build

build: build-frontend build-backend

build-frontend:
	cd $(FRONTEND_DIR) && npm run build

build-backend:
	cd $(BACKEND_DIR) && go build ./cmd/api

test: test-backend

test-backend:
	cd $(BACKEND_DIR) && go test ./...

fmt:
	gofmt -w $(BACKEND_DIR)

lint: lint-frontend lint-backend

lint-frontend:
	cd $(FRONTEND_DIR) && npm run lint

lint-backend:
	cd $(BACKEND_DIR) && go vet ./...

ci: fmt lint test build

clean:
	$(COMPOSE) down -v --remove-orphans
