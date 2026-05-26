package auth

import "errors"

var (
	ErrInvalidCredentials = errors.New("invalid firebase credentials")
	ErrUserNotFound       = errors.New("user not found")
)
