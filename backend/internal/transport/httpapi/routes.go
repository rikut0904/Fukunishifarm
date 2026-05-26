package httpapi

import (
	"context"
	"errors"
	"strings"
	"time"

	domainauth "fukunishifarm/backend/internal/domain/auth"
	domaingrape "fukunishifarm/backend/internal/domain/grape"
	usecaseauth "fukunishifarm/backend/internal/usecase/auth"
	usecasegrape "fukunishifarm/backend/internal/usecase/grape"
	huma "github.com/danielgtaylor/huma/v2"
)

type healthOutput struct {
	Body struct {
		Status   string `json:"status" example:"ok"`
		Service  string `json:"service" example:"fukunishi-farm-api"`
		Migrated bool   `json:"migrated"`
	}
}

type sessionInput struct {
	Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
}

type loginInput struct {
	Body struct {
		Email    string `json:"email" required:"true" example:"admin@example.com"`
		Password string `json:"password" required:"true" example:"password"`
	}
}

type createUserInput struct {
	Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
	Body          struct {
		Email       string `json:"email" required:"true" example:"new-user@example.com"`
		Password    string `json:"password" required:"true" example:"password"`
		DisplayName string `json:"displayName,omitempty" example:"新規ユーザー"`
	}
}

type adminUserResponse struct {
	ID          uint      `json:"id"`
	FirebaseUID string    `json:"firebaseUid"`
	Email       string    `json:"email"`
	DisplayName string    `json:"displayName,omitempty"`
	PhotoURL    string    `json:"photoURL,omitempty"`
	Role        string    `json:"role"`
	LastLoginAt time.Time `json:"lastLoginAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type sessionOutput struct {
	Body struct {
		User adminUserResponse `json:"user"`
	}
}

type loginOutput struct {
	Body struct {
		Token string            `json:"token"`
		User  adminUserResponse `json:"user"`
	}
}

type createUserOutput struct {
	Body struct {
		User adminUserResponse `json:"user"`
	}
}

type grapeItemResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsOnSale    bool      `json:"isOnSale"`
	ImagePath   string    `json:"imagePath"`
	ImageFocus  string    `json:"imageFocus"`
	SortOrder   int       `json:"sortOrder"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type grapeCatalogResponse struct {
	Body struct {
		Items []grapeItemResponse `json:"items"`
	}
}

type grapeItemInput struct {
	Name        string `json:"name" required:"true"`
	Description string `json:"description" required:"true"`
	IsOnSale    bool   `json:"isOnSale"`
	ImagePath   string `json:"imagePath" required:"true"`
	ImageFocus  string `json:"imageFocus" required:"true"`
}

type grapeCatalogInput struct {
	Body struct {
		Items []grapeItemInput `json:"items"`
	}
}

func Register(api huma.API, authService *usecaseauth.Service, grapeService *usecasegrape.Service, migrated bool) {
	huma.Get(api, "/healthz", func(ctx context.Context, input *struct{}) (*healthOutput, error) {
		output := &healthOutput{}
		output.Body.Status = "ok"
		output.Body.Service = "fukunishi-farm-api"
		output.Body.Migrated = migrated
		return output, nil
	})

	huma.Post(api, "/v1/admin/users", func(ctx context.Context, input *createUserInput) (*createUserOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		user, err := authService.CreateUser(ctx, token, input.Body.Email, input.Body.Password, input.Body.DisplayName)
		if err != nil {
			return nil, mapAuthError("failed to create firebase user", err)
		}

		output := &createUserOutput{}
		output.Body.User = toAdminUserResponse(user)
		return output, nil
	})

	huma.Post(api, "/v1/auth/login", func(ctx context.Context, input *loginInput) (*loginOutput, error) {
		session, err := authService.LoginAdmin(ctx, input.Body.Email, input.Body.Password)
		if err != nil {
			return nil, mapAuthError("failed to login", err)
		}

		output := &loginOutput{}
		output.Body.Token = session.Token
		output.Body.User = toAdminUserResponse(session.User)
		return output, nil
	})

	huma.Get(api, "/v1/auth/session", func(ctx context.Context, input *sessionInput) (*sessionOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		user, err := authService.GetSession(ctx, token)
		if err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		output := &sessionOutput{}
		output.Body.User = toAdminUserResponse(user)
		return output, nil
	})

	huma.Get(api, "/v1/grapes", func(ctx context.Context, input *struct{}) (*grapeCatalogResponse, error) {
		catalog, err := grapeService.GetPublicCatalog(ctx)
		if err != nil {
			return nil, mapGrapeError("failed to load grape catalog", err)
		}

		return toGrapeCatalogResponse(catalog), nil
	})

	huma.Get(api, "/v1/admin/grapes", func(ctx context.Context, input *sessionInput) (*grapeCatalogResponse, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		catalog, err := grapeService.GetAdminCatalog(ctx)
		if err != nil {
			return nil, mapGrapeError("failed to load grape catalog", err)
		}

		return toGrapeCatalogResponse(catalog), nil
	})

	huma.Put(api, "/v1/admin/grapes", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		Body          grapeCatalogInput
	}) (*grapeCatalogResponse, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		catalog, err := grapeService.ReplaceCatalog(ctx, toGrapeCatalog(input.Body))
		if err != nil {
			return nil, mapGrapeError("failed to update grape catalog", err)
		}

		return toGrapeCatalogResponse(catalog), nil
	})
}

func mapAuthError(message string, err error) error {
	switch {
	case errors.Is(err, usecaseauth.ErrInvalidInput):
		return huma.Error400BadRequest("invalid input", err)
	case errors.Is(err, domainauth.ErrInvalidInput):
		return huma.Error400BadRequest("invalid input", err)
	case errors.Is(err, usecaseauth.ErrUnauthorized):
		return huma.Error401Unauthorized("unauthorized")
	case errors.Is(err, usecaseauth.ErrForbidden):
		return huma.Error403Forbidden("forbidden")
	case errors.Is(err, domainauth.ErrUserNotFound):
		return huma.Error401Unauthorized("unauthorized")
	default:
		return huma.Error500InternalServerError(message, err)
	}
}

func mapGrapeError(message string, err error) error {
	switch {
	case errors.Is(err, domaingrape.ErrInvalidInput):
		return huma.Error400BadRequest("invalid input", err)
	default:
		return huma.Error500InternalServerError(message, err)
	}
}

func bearerToken(header string) string {
	value := strings.TrimSpace(header)
	if value == "" {
		return ""
	}

	parts := strings.Fields(value)
	if len(parts) != 2 {
		return ""
	}

	if !strings.EqualFold(parts[0], "bearer") {
		return ""
	}

	return strings.TrimSpace(parts[1])
}

func toAdminUserResponse(user *domainauth.AdminUser) adminUserResponse {
	return adminUserResponse{
		ID:          user.ID,
		FirebaseUID: user.FirebaseUID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		PhotoURL:    user.PhotoURL,
		Role:        user.Role,
		LastLoginAt: user.LastLoginAt,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}
}

func toGrapeCatalog(input grapeCatalogInput) domaingrape.Catalog {
	items := make([]domaingrape.Item, 0, len(input.Body.Items))
	for _, item := range input.Body.Items {
		items = append(items, domaingrape.Item{
			Name:        item.Name,
			Description: item.Description,
			IsOnSale:    item.IsOnSale,
			ImagePath:   item.ImagePath,
			ImageFocus:  item.ImageFocus,
		})
	}

	return domaingrape.Catalog{Items: items}
}

func toGrapeCatalogResponse(catalog domaingrape.Catalog) *grapeCatalogResponse {
	output := &grapeCatalogResponse{}
	output.Body.Items = make([]grapeItemResponse, 0, len(catalog.Items))
	for _, item := range catalog.Items {
		output.Body.Items = append(output.Body.Items, toGrapeItemResponse(item))
	}

	return output
}

func toGrapeItemResponse(item domaingrape.Item) grapeItemResponse {
	return grapeItemResponse{
		ID:          item.ID,
		Name:        item.Name,
		Description: item.Description,
		IsOnSale:    item.IsOnSale,
		ImagePath:   item.ImagePath,
		ImageFocus:  item.ImageFocus,
		SortOrder:   item.SortOrder,
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}
}
