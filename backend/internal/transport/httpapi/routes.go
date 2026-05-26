package httpapi

import (
	"context"
	"net/http"
	"strings"
	"time"

	domainauth "fukunishifarm/backend/internal/domain/auth"
	usecaseauth "fukunishifarm/backend/internal/usecase/auth"
	huma "github.com/danielgtaylor/huma/v2"
)

type healthOutput struct {
	Body struct {
		Status  string `json:"status" example:"ok"`
		Service string `json:"service" example:"fukunishi-farm-api"`
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

func Register(api huma.API, service *usecaseauth.Service) {
	huma.Get(api, "/healthz", func(ctx context.Context, input *struct{}) (*healthOutput, error) {
		output := &healthOutput{}
		output.Body.Status = "ok"
		output.Body.Service = "fukunishi-farm-api"
		return output, nil
	})

	huma.Post(api, "/v1/admin/users", func(ctx context.Context, input *createUserInput) (*createUserOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error401Unauthorized("missing bearer token")
		}

		user, err := service.CreateUser(ctx, token, input.Body.Email, input.Body.Password, input.Body.DisplayName)
		if err != nil {
			switch {
			case err == usecaseauth.ErrUnauthorized:
				return nil, huma.Error401Unauthorized("unauthorized")
			case err == usecaseauth.ErrForbidden:
				return nil, huma.Error403Forbidden("forbidden")
			default:
				return nil, huma.NewError(http.StatusInternalServerError, "failed to create firebase user", err)
			}
		}

		output := &createUserOutput{}
		output.Body.User = toAdminUserResponse(user)
		return output, nil
	})

	huma.Post(api, "/v1/auth/login", func(ctx context.Context, input *loginInput) (*loginOutput, error) {
		session, err := service.LoginAdmin(ctx, input.Body.Email, input.Body.Password)
		if err != nil {
			switch {
			case err == usecaseauth.ErrUnauthorized:
				return nil, huma.Error401Unauthorized("unauthorized")
			case err == usecaseauth.ErrForbidden:
				return nil, huma.Error403Forbidden("forbidden")
			default:
				return nil, huma.NewError(http.StatusInternalServerError, "failed to login", err)
			}
		}

		output := &loginOutput{}
		output.Body.Token = session.Token
		output.Body.User = toAdminUserResponse(session.User)
		return output, nil
	})

	huma.Get(api, "/v1/auth/session", func(ctx context.Context, input *sessionInput) (*sessionOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error401Unauthorized("missing bearer token")
		}

		user, err := service.GetSession(ctx, token)
		if err != nil {
			switch {
			case err == usecaseauth.ErrUnauthorized:
				return nil, huma.Error401Unauthorized("unauthorized")
			case err == usecaseauth.ErrForbidden:
				return nil, huma.Error403Forbidden("forbidden")
			default:
				return nil, huma.NewError(http.StatusInternalServerError, "failed to load admin session", err)
			}
		}

		output := &sessionOutput{}
		output.Body.User = toAdminUserResponse(user)
		return output, nil
	})
}

func bearerToken(header string) string {
	value := strings.TrimSpace(header)
	if value == "" {
		return ""
	}

	const prefix = "Bearer "
	if !strings.HasPrefix(value, prefix) {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(value, prefix))
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
