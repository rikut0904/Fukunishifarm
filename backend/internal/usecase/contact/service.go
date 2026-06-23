package contact

import (
	"context"
	"fmt"
	"log/slog"
	"net/mail"
	"strings"

	domainauth "fukunishifarm/backend/internal/domain/auth"
	domaincontact "fukunishifarm/backend/internal/domain/contact"
	"github.com/google/uuid"
)

type Service struct {
	repository  domaincontact.Repository
	adminRepo   domainauth.Repository
	mailer      domaincontact.ReplyEmailSender
	siteBaseURL string
}

type ReplyAuthor struct {
	UserID uint
	Name   string
	Email  string
}

func NewService(repository domaincontact.Repository, adminRepo domainauth.Repository, mailer domaincontact.ReplyEmailSender, siteBaseURL string) *Service {
	return &Service{
		repository:  repository,
		adminRepo:   adminRepo,
		mailer:      mailer,
		siteBaseURL: strings.TrimRight(strings.TrimSpace(siteBaseURL), "/"),
	}
}

func (s *Service) SubmitMessage(ctx context.Context, message domaincontact.Message) (domaincontact.Message, error) {
	normalized, err := normalizeMessage(message)
	if err != nil {
		return domaincontact.Message{}, err
	}

	normalized.ThreadID = uuid.NewString()

	saved, err := s.repository.CreateMessage(ctx, normalized)
	if err != nil {
		return domaincontact.Message{}, fmt.Errorf("create contact message: %w", err)
	}

	var adminUsers []domainauth.AdminUser
	if s.adminRepo != nil {
		// 管理者ユーザー全員を取得
		adminUsers, err = s.adminRepo.ListAdminUsers(ctx)
		if err != nil {
			slog.Error("failed to list admin users for contact notification", "error", err)
		}
	}

	if s.mailer != nil && len(adminUsers) > 0 {
		adminURL := ""
		if s.siteBaseURL != "" {
			adminURL = fmt.Sprintf("%s/admin/contact/%d", s.siteBaseURL, saved.ID)
		}

		subject := "【ふくにしファーム】新規お問い合わせがありました"
		lines := []string{
			"ふくにしファームの管理者様",
			"",
			"ウェブサイトより新しいお問い合わせがありました。",
			"",
			"■ お問い合わせ内容",
			"お名前: " + saved.Name,
			"メールアドレス: " + saved.Email,
			"カテゴリ: " + saved.Category,
			"件名: " + saved.Subject,
			"",
			"内容:",
			saved.Body,
		}
		if adminURL != "" {
			lines = append(lines, "", "■ 管理者対応URL", adminURL)
		}
		bodyText := strings.Join(lines, "\n")

		go func(adminUsers []domainauth.AdminUser, subject, bodyText string) {
			for _, admin := range adminUsers {
				if strings.TrimSpace(admin.Email) == "" {
					continue
				}
				if err := s.mailer.SendReplyEmail(context.Background(), admin.Email, subject, bodyText); err != nil {
					slog.Error("failed to send contact notification email to admin", "email", admin.Email, "error", err)
				}
			}
		}(append([]domainauth.AdminUser(nil), adminUsers...), subject, bodyText)
	}

	return saved, nil
}

func (s *Service) ListMessages(ctx context.Context, status string, page, limit int) ([]domaincontact.Message, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 25
	}
	offset := (page - 1) * limit

	messages, total, err := s.repository.ListMessages(ctx, status, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("list contact messages: %w", err)
	}

	return messages, total, nil
}

func (s *Service) GetMessage(ctx context.Context, id uint) (domaincontact.Message, error) {
	message, err := s.repository.GetMessage(ctx, id)
	if err != nil {
		return domaincontact.Message{}, fmt.Errorf("get contact message: %w", err)
	}

	return message, nil
}

func (s *Service) GetMessageByThreadID(ctx context.Context, threadID string) (domaincontact.Message, error) {
	message, err := s.repository.GetMessageByThreadID(ctx, strings.TrimSpace(threadID))
	if err != nil {
		return domaincontact.Message{}, fmt.Errorf("get contact message: %w", err)
	}

	return message, nil
}

type MessageDetail struct {
	Message domaincontact.Message
	Replies []domaincontact.Reply
}

func (s *Service) GetMessageDetailByThreadID(ctx context.Context, threadID string) (MessageDetail, error) {
	message, err := s.GetMessageByThreadID(ctx, threadID)
	if err != nil {
		return MessageDetail{}, err
	}

	replies, err := s.repository.ListReplies(ctx, message.ID)
	if err != nil {
		return MessageDetail{}, fmt.Errorf("list contact replies: %w", err)
	}

	return MessageDetail{
		Message: message,
		Replies: replies,
	}, nil
}

func (s *Service) GetMessageDetail(ctx context.Context, id uint) (MessageDetail, error) {
	message, err := s.repository.GetMessage(ctx, id)
	if err != nil {
		return MessageDetail{}, fmt.Errorf("get contact message: %w", err)
	}

	replies, err := s.repository.ListReplies(ctx, id)
	if err != nil {
		return MessageDetail{}, fmt.Errorf("list contact replies: %w", err)
	}

	return MessageDetail{
		Message: message,
		Replies: replies,
	}, nil
}

func (s *Service) ReplyMessage(ctx context.Context, messageID uint, author ReplyAuthor, body string) (domaincontact.Reply, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return domaincontact.Reply{}, domaincontact.ErrInvalidInput
	}

	message, err := s.GetMessage(ctx, messageID)
	if err != nil {
		return domaincontact.Reply{}, err
	}

	author.Name = strings.TrimSpace(author.Name)
	author.Email = strings.TrimSpace(author.Email)
	if author.Name == "" {
		author.Name = author.Email
	}
	if author.Name == "" {
		author.Name = "運営"
	}
	if author.Email == "" {
		author.Email = "unknown@example.com"
	}

	if s.mailer == nil {
		return domaincontact.Reply{}, domaincontact.ErrMailNotConfigured
	}

	saved, err := s.repository.CreateReply(ctx, domaincontact.Reply{
		MessageID:    messageID,
		ThreadID:     message.ThreadID,
		SenderType:   "admin",
		SenderUserID: author.UserID,
		SenderName:   author.Name,
		SenderEmail:  author.Email,
		Message:      body,
	})
	if err != nil {
		return domaincontact.Reply{}, fmt.Errorf("create contact reply: %w", err)
	}

	subject := "【ふくにしファーム】お問い合わせへのご返信"
	if strings.TrimSpace(message.Subject) != "" {
		subject = "【ふくにしファーム】" + strings.TrimSpace(message.Subject) + " へのご返信"
	}

	replyURL := ""
	if s.siteBaseURL != "" {
		replyURL = s.siteBaseURL + "/contact/" + message.ThreadID
	}

	lines := []string{
		"いつもふくにしファームをご利用いただき、ありがとうございます。",
		"",
		"お問い合わせへのご返信をお送りします。",
		"",
		"返信内容",
		body,
		"",
		"お名前: " + message.Name,
		"メールアドレス: " + message.Email,
		"件名: " + message.Subject,
	}
	if replyURL != "" {
		lines = append(lines, "", "返信用URL: "+replyURL)
	}

	bodyText := strings.Join(lines, "\n")

	if err := s.mailer.SendReplyEmail(ctx, message.Email, subject, bodyText); err != nil {
		slog.Error("failed to send contact reply email", "message_id", message.ID, "email", message.Email, "error", err)
		return saved, fmt.Errorf("send contact reply email: %w", err)
	}

	return saved, nil
}

func (s *Service) ReplyThread(ctx context.Context, threadID string, body string) (domaincontact.Reply, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return domaincontact.Reply{}, domaincontact.ErrInvalidInput
	}

	message, err := s.GetMessageByThreadID(ctx, threadID)
	if err != nil {
		return domaincontact.Reply{}, err
	}

	saved, err := s.repository.CreateReplyAndUpdateMessageStatus(ctx, domaincontact.Reply{
		MessageID:    message.ID,
		ThreadID:     message.ThreadID,
		SenderType:   "customer",
		SenderUserID: 0,
		SenderName:   message.Name,
		SenderEmail:  message.Email,
		Message:      body,
	}, "in_progress")
	if err != nil {
		return domaincontact.Reply{}, fmt.Errorf("create contact reply: %w", err)
	}

	return saved, nil
}

func (s *Service) UpdateStatus(ctx context.Context, id uint, status string) error {
	status = strings.TrimSpace(status)
	if status != "pending" && status != "in_progress" && status != "resolved" {
		return domaincontact.ErrInvalidInput
	}
	return s.repository.UpdateMessageStatus(ctx, id, status)
}

func normalizeMessage(message domaincontact.Message) (domaincontact.Message, error) {
	message.Name = strings.TrimSpace(message.Name)
	message.Email = strings.TrimSpace(message.Email)
	message.Category = strings.TrimSpace(message.Category)
	message.Subject = strings.TrimSpace(message.Subject)
	message.Body = strings.TrimSpace(message.Body)

	if message.Category == "" {
		message.Category = "general"
	}

	if message.Status == "" {
		message.Status = "pending"
	}

	if message.Name == "" || message.Email == "" || message.Subject == "" || message.Body == "" {
		return domaincontact.Message{}, domaincontact.ErrInvalidInput
	}

	addr, err := mail.ParseAddress(message.Email)
	if err != nil {
		return domaincontact.Message{}, domaincontact.ErrInvalidInput
	}
	message.Email = strings.TrimSpace(addr.Address)
	if message.Email == "" {
		return domaincontact.Message{}, domaincontact.ErrInvalidInput
	}

	return message, nil
}
