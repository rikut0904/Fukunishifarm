package news

import "errors"

var ErrInvalidInput = errors.New("invalid news input")
var ErrItemNotFound = errors.New("news item not found")
