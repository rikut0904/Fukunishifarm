package auth

import "context"

type InvitationEmailSender interface {
	SendInvitationEmail(ctx context.Context, toEmail, subject, body string) error
}
