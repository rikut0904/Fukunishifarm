package contact

import (
	"context"
	"fmt"
	"net/mail"
	"strings"

	domaincontact "fukunishifarm/backend/internal/domain/contact"
	"github.com/google/uuid"
)

type Service struct {
	repository  domaincontact.Repository
	mailer      domaincontact.ReplyEmailSender
	siteBaseURL string
}

type ReplyAuthor struct {
	UserID uint
	Name   string
	Email  string
}

func NewService(repository domaincontact.Repository, mailer domaincontact.ReplyEmailSender, siteBaseURL string) *Service {
	return &Service{repository: repository, mailer: mailer, siteBaseURL: strings.TrimRight(strings.TrimSpace(siteBaseURL), "/")}
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

	return saved, nil
}

func (s *Service) ListMessages(ctx context.Context) ([]domaincontact.Message, error) {
	messages, err := s.repository.ListMessages(ctx)
	if err != nil {
		return nil, fmt.Errorf("list contact messages: %w", err)
	}

	return messages, nil
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

	if s.mailer != nil {
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
			return saved, nil
		}
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

	saved, err := s.repository.CreateReply(ctx, domaincontact.Reply{
		MessageID:    message.ID,
		ThreadID:     message.ThreadID,
		SenderType:   "customer",
		SenderUserID: 0,
		SenderName:   message.Name,
		SenderEmail:  message.Email,
		Message:      body,
	})
	if err != nil {
		return domaincontact.Reply{}, fmt.Errorf("create contact reply: %w", err)
	}

	return saved, nil
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

	if message.Name == "" || message.Email == "" || message.Subject == "" || message.Body == "" {
		return domaincontact.Message{}, domaincontact.ErrInvalidInput
	}

	if _, err := mail.ParseAddress(message.Email); err != nil {
		return domaincontact.Message{}, domaincontact.ErrInvalidInput
	}

	return message, nil
}
