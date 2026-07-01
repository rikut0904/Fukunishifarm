package auth

import "context"

type Repository interface {
	UpsertAdminUser(ctx context.Context, identity VerifiedIdentity) (*AdminUser, error)
	FindAdminUserByID(ctx context.Context, id uint) (*AdminUser, error)
	FindAdminUserByFirebaseUID(ctx context.Context, firebaseUID string) (*AdminUser, error)
	ListAdminUsers(ctx context.Context) ([]AdminUser, error)
	DeleteAdminUserByFirebaseUID(ctx context.Context, firebaseUID string) error
}
