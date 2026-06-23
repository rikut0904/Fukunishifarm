package contact

import "context"

type Repository interface {
	CreateMessage(ctx context.Context, message Message) (Message, error)
	ListMessages(ctx context.Context, status string, offset, limit int) ([]Message, int64, error)
	GetMessage(ctx context.Context, id uint) (Message, error)
	GetMessageByThreadID(ctx context.Context, threadID string) (Message, error)
	UpdateMessageStatus(ctx context.Context, id uint, status string) error
	CreateReply(ctx context.Context, reply Reply) (Reply, error)
	CreateReplyAndUpdateMessageStatus(ctx context.Context, reply Reply, status string) (Reply, error)
	ListReplies(ctx context.Context, messageID uint) ([]Reply, error)
}
