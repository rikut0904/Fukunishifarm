package auth

import "context"

type TokenVerifier interface {
	VerifyIDToken(ctx context.Context, token string) (VerifiedIdentity, error)
}
