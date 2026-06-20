package contact

import "context"

type Repository interface {
	CreateMessage(ctx context.Context, message Message) (Message, error)
	ListMessages(ctx context.Context) ([]Message, error)
	GetMessage(ctx context.Context, id uint) (Message, error)
	CreateReply(ctx context.Context, reply Reply) (Reply, error)
	ListReplies(ctx context.Context, messageID uint) ([]Reply, error)
}
