SHELL := /bin/sh

COMPOSE ?= docker compose
FRONTEND_DIR := frontend
BACKEND_DIR := backend

.PHONY: up down admin build test fmt lint ci clean

up:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

admin:
	@sh -c 'EMAIL="$${EMAIL:-}"; PASSWORD="$${PASSWORD:-}"; DISPLAY_NAME="$${DISPLAY_NAME:-}"; \
	if [ -z "$$EMAIL" ]; then printf "Email: "; read -r EMAIL; fi; \
	if [ -z "$$PASSWORD" ]; then printf "Password: "; read -r PASSWORD; fi; \
	if [ -z "$$DISPLAY_NAME" ]; then printf "Display name (optional): "; read -r DISPLAY_NAME || true; fi; \
	cd $(BACKEND_DIR) && go run ./cmd/admin -email "$$EMAIL" -password "$$PASSWORD" -display-name "$$DISPLAY_NAME"'

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
