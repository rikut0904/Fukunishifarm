package auth

import "errors"

var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidCredentials = errors.New("invalid firebase credentials")
	ErrUserNotFound       = errors.New("user not found")
	ErrMailNotConfigured  = errors.New("mail sender not configured")
	ErrEmailAlreadyExists = errors.New("email already exists")
)
