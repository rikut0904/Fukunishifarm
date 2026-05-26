package auth

import "context"

type Repository interface {
	UpsertAdminUser(ctx context.Context, identity VerifiedIdentity) (*AdminUser, error)
	FindAdminUserByFirebaseUID(ctx context.Context, firebaseUID string) (*AdminUser, error)
}
