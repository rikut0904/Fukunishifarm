package contact

import "errors"

var ErrInvalidInput = errors.New("invalid contact input")
var ErrMessageNotFound = errors.New("contact message not found")
var ErrMailNotConfigured = errors.New("contact mail sender is not configured")
