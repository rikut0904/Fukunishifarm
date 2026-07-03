package auth

import "context"

type SessionClaims struct {
	FirebaseUID string
	Email       string
	AdminUserID uint
}

type SessionManager interface {
	Issue(ctx context.Context, claims SessionClaims) (string, error)
	Verify(ctx context.Context, token string) (SessionClaims, error)
}
