package auth

import "context"

type Repository interface {
	CreateAdminUser(ctx context.Context, identity VerifiedIdentity) (*AdminUser, error)
	UpsertLoginAdminUser(ctx context.Context, identity VerifiedIdentity) (*AdminUser, error)
	FindAdminUserByID(ctx context.Context, id uint) (*AdminUser, error)
	FindAdminUserByFirebaseUID(ctx context.Context, firebaseUID string) (*AdminUser, error)
	ListAdminUsers(ctx context.Context) ([]AdminUser, error)
	DeleteAdminUserByFirebaseUID(ctx context.Context, firebaseUID string) error
}
