package auth

import "context"

type AccountCreator interface {
	CreateUser(ctx context.Context, email, password, displayName string) (VerifiedIdentity, error)
	CreateInvitedUser(ctx context.Context, email, displayName string) (VerifiedIdentity, error)
	DeleteUser(ctx context.Context, firebaseUID string) error
	GeneratePasswordSetupLink(ctx context.Context, email, continueURL string) (string, error)
}
