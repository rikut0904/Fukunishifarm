package contact

import "context"

type Repository interface {
	CreateMessage(ctx context.Context, message Message) (Message, error)
}
