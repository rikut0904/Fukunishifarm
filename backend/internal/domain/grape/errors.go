package grape

import "errors"

var (
	ErrInvalidInput = errors.New("invalid input")
	ErrItemNotFound = errors.New("item not found")
)
