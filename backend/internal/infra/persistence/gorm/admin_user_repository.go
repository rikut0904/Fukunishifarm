package gormrepo

import (
	"context"
	"time"

	domainauth "fukunishifarm/backend/internal/domain/auth"

	"gorm.io/gorm"
)

type AdminUserRepository struct {
	db *gorm.DB
}

func NewAdminUserRepository(db *gorm.DB) *AdminUserRepository {
	return &AdminUserRepository{db: db}
}

func (r *AdminUserRepository) UpsertAdminUser(ctx context.Context, identity domainauth.VerifiedIdentity) (*domainauth.AdminUser, error) {
	now := time.Now().UTC()

	user := domainauth.AdminUser{
		FirebaseUID: identity.FirebaseUID,
		Email:       identity.Email,
		DisplayName: identity.DisplayName,
		PhotoURL:    identity.PhotoURL,
		Role:        "admin",
		LastLoginAt: now,
	}

	tx := r.db.WithContext(ctx).Where(domainauth.AdminUser{FirebaseUID: identity.FirebaseUID}).
		Assign(domainauth.AdminUser{
			Email:       identity.Email,
			DisplayName: identity.DisplayName,
			PhotoURL:    identity.PhotoURL,
			Role:        "admin",
			LastLoginAt: now,
		}).
		FirstOrCreate(&user)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return &user, nil
}

func (r *AdminUserRepository) FindAdminUserByFirebaseUID(ctx context.Context, firebaseUID string) (*domainauth.AdminUser, error) {
	var user domainauth.AdminUser

	tx := r.db.WithContext(ctx).Where("firebase_uid = ?", firebaseUID).First(&user)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return &user, nil
}
