package gormrepo

import (
	"context"
	"errors"
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

func (r *AdminUserRepository) CreateAdminUser(ctx context.Context, identity domainauth.VerifiedIdentity) (*domainauth.AdminUser, error) {
	user := domainauth.AdminUser{
		FirebaseUID: identity.FirebaseUID,
		Email:       identity.Email,
		DisplayName: identity.DisplayName,
		PhotoURL:    identity.PhotoURL,
		Role:        "admin",
	}

	tx := r.db.WithContext(ctx).Where(domainauth.AdminUser{FirebaseUID: identity.FirebaseUID}).
		Assign(domainauth.AdminUser{
			Email:       identity.Email,
			DisplayName: identity.DisplayName,
			PhotoURL:    identity.PhotoURL,
			Role:        "admin",
		}).
		FirstOrCreate(&user)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return &user, nil
}

func (r *AdminUserRepository) UpsertLoginAdminUser(ctx context.Context, identity domainauth.VerifiedIdentity) (*domainauth.AdminUser, error) {
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
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			return nil, domainauth.ErrUserNotFound
		}
		return nil, tx.Error
	}

	return &user, nil
}

func (r *AdminUserRepository) FindAdminUserByID(ctx context.Context, id uint) (*domainauth.AdminUser, error) {
	var user domainauth.AdminUser

	tx := r.db.WithContext(ctx).Where("id = ?", id).First(&user)
	if tx.Error != nil {
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			return nil, domainauth.ErrUserNotFound
		}
		return nil, tx.Error
	}

	return &user, nil
}

func (r *AdminUserRepository) ListAdminUsers(ctx context.Context) ([]domainauth.AdminUser, error) {
	var users []domainauth.AdminUser

	tx := r.db.WithContext(ctx).Order("created_at DESC").Find(&users)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return users, nil
}

func (r *AdminUserRepository) DeleteAdminUserByFirebaseUID(ctx context.Context, firebaseUID string) error {
	tx := r.db.WithContext(ctx).Where("firebase_uid = ?", firebaseUID).Delete(&domainauth.AdminUser{})
	if tx.Error != nil {
		return tx.Error
	}

	return nil
}
