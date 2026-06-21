package contact

import "context"

type Repository interface {
	CreateMessage(ctx context.Context, message Message) (Message, error)
	ListMessages(ctx context.Context) ([]Message, error)
	GetMessage(ctx context.Context, id uint) (Message, error)
	GetMessageByThreadID(ctx context.Context, threadID string) (Message, error)
	UpdateMessageStatus(ctx context.Context, id uint, status string) error
	CreateReply(ctx context.Context, reply Reply) (Reply, error)
	ListReplies(ctx context.Context, messageID uint) ([]Reply, error)
}
