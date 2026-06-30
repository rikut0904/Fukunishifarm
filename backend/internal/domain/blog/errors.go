package blog

import "errors"

var (
	ErrInvalidInput = errors.New("invalid blog input")
	ErrPostNotFound = errors.New("blog post not found")
)
