package contact

import "context"

type ReplyEmailSender interface {
	SendReplyEmail(ctx context.Context, toEmail, subject, body string) error
}
