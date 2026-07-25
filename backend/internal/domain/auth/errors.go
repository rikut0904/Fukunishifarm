package auth

import "errors"

var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidCredentials = errors.New("invalid firebase credentials")
	ErrUserNotFound       = errors.New("user not found")
	ErrMailNotConfigured  = errors.New("mail sender not configured")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrFirebaseAuthConfig = errors.New("firebase authentication is not configured")
	ErrFirebasePermission = errors.New("firebase service account has insufficient permission")
	ErrUnauthorizedURL    = errors.New("unauthorized firebase action URL")
)
