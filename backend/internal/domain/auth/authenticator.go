package auth

import (
	"context"
)

type PasswordAuthenticator interface {
	AuthenticateWithPassword(ctx context.Context, email, password string) (LoginResult, error)
}
