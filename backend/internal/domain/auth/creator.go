package auth

import "context"

type AccountCreator interface {
	CreateUser(ctx context.Context, email, password, displayName string) (VerifiedIdentity, error)
}
