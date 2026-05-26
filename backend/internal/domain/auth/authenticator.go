package auth

import (
	"context"
	"errors"
)

var ErrInvalidCredentials = errors.New("invalid firebase credentials")

type PasswordAuthenticator interface {
	AuthenticateWithPassword(ctx context.Context, email, password string) (LoginResult, error)
}
