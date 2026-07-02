package contact

import (
	"context"
	"fmt"
	"log/slog"
	"net/mail"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

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

const contactMailPrefix = "【ふくにしファーム】"
const maxContactListLimit = 100
const contactStatusUpdateTimeout = 10 * time.Second
const (
	maxContactNameLength    = 80
	maxContactEmailLength   = 320
	maxContactSubjectLength = 160
	maxContactBodyLength    = 65535
)

type SubmissionMeta struct {
	Honeypot string
}

type ReplyAuthor struct {
	UserID uint
	Name   string
	Email  string
}

func newContactStatusUpdateContext() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), contactStatusUpdateTimeout)
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

	s.notifyAdminUsersAsync(adminUsers, buildNewInquiryNotification(saved, s.siteBaseURL))

	return saved, nil
}

func (s *Service) SubmitPublicMessage(ctx context.Context, message domaincontact.Message, meta SubmissionMeta) (domaincontact.Message, error) {
	if err := validateSubmissionMeta(meta); err != nil {
		return domaincontact.Message{}, err
	}

	return s.SubmitMessage(ctx, message)
}

func validateSubmissionMeta(meta SubmissionMeta) error {
	if strings.TrimSpace(meta.Honeypot) != "" {
		return domaincontact.ErrInvalidInput
	}

	return nil
}

func (s *Service) ListMessages(ctx context.Context, status string, page, limit int) ([]domaincontact.Message, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 25
	}
	if limit > maxContactListLimit {
		limit = maxContactListLimit
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

	// 一般ユーザー向けには送信済みの返信のみを公開する。
	sentReplies := make([]domaincontact.Reply, 0, len(replies))
	for _, r := range replies {
		if r.Status == "sent" {
			sentReplies = append(sentReplies, r)
		}
	}

	return MessageDetail{
		Message: message,
		Replies: sentReplies,
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

	if s.mailer == nil {
		return domaincontact.Reply{}, domaincontact.ErrMailNotConfigured
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

	const senderNameMaxRunes = 255
	if runes := []rune(author.Name); len(runes) > senderNameMaxRunes {
		author.Name = string(runes[:senderNameMaxRunes])
	}

	saved, err := s.repository.CreateReply(ctx, domaincontact.Reply{
		MessageID:    messageID,
		ThreadID:     message.ThreadID,
		SenderType:   "admin",
		SenderUserID: author.UserID,
		SenderName:   author.Name,
		SenderEmail:  author.Email,
		Message:      body,
		Status:       "pending",
	})
	if err != nil {
		return domaincontact.Reply{}, fmt.Errorf("create contact reply: %w", err)
	}

	subject := subjectWithPrefix(message.Subject, "へのご返信")

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
		func() {
			updateCtx, cancel := newContactStatusUpdateContext()
			defer cancel()

			if updateErr := s.repository.UpdateReplyStatus(updateCtx, saved.ID, "failed"); updateErr != nil {
				slog.Error("failed to update contact reply status", "reply_id", saved.ID, "status", "failed", "error", updateErr)
			} else {
				saved.Status = "failed"
			}
		}()
		return saved, fmt.Errorf("send contact reply email: %w", err)
	}

	if err := func() error {
		replyUpdateCtx, replyUpdateCancel := newContactStatusUpdateContext()
		defer replyUpdateCancel()

		if err := s.repository.UpdateReplyStatus(replyUpdateCtx, saved.ID, "sent"); err != nil {
			return err
		}

		saved.Status = "sent"
		return nil
	}(); err != nil {
		slog.Error("failed to update contact reply status", "reply_id", saved.ID, "error", err)
		return saved, fmt.Errorf("update contact reply status: %w", err)
	}

	if message.Status == "pending" {
		func() {
			messageUpdateCtx, messageUpdateCancel := newContactStatusUpdateContext()
			defer messageUpdateCancel()

			if err := s.repository.UpdateMessageStatus(messageUpdateCtx, messageID, "in_progress"); err != nil {
				slog.Error("failed to update contact message status after reply", "message_id", messageID, "error", err)
			}
		}()
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
		Status:       "sent",
	}, "in_progress")
	if err != nil {
		return domaincontact.Reply{}, fmt.Errorf("create contact reply: %w", err)
	}

	var adminUsers []domainauth.AdminUser
	if s.adminRepo != nil {
		adminUsers, err = s.adminRepo.ListAdminUsers(ctx)
		if err != nil {
			slog.Error("failed to list admin users for contact reply notification", "error", err)
		}
	}

	s.notifyAdminUsersAsync(adminUsers, buildCustomerReplyNotification(message, body, s.siteBaseURL))

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

	if exceedsContactMaxLength(message.Name, maxContactNameLength) || exceedsContactMaxLength(message.Email, maxContactEmailLength) || exceedsContactMaxLength(message.Subject, maxContactSubjectLength) || exceedsContactMaxLength(message.Body, maxContactBodyLength) {
		return domaincontact.Message{}, domaincontact.ErrInvalidInput
	}

	if !isAllowedContactCategory(message.Category) {
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

func isAllowedContactCategory(category string) bool {
	switch category {
	case "grape", "price", "access", "reservation", "other", "general":
		return true
	default:
		return false
	}
}

func contactCategoryLabel(category string) string {
	switch category {
	case "grape":
		return "ぶどう狩りについて"
	case "reservation":
		return "予約について"
	case "price":
		return "料金について"
	case "access":
		return "アクセスについて"
	case "other":
		return "その他"
	case "general":
		return "一般"
	default:
		return category
	}
}

func exceedsContactMaxLength(value string, max int) bool {
	return utf8.RuneCountInString(value) > max
}

func subjectWithPrefix(subject, suffix string) string {
	subject = strings.TrimSpace(subject)
	suffix = strings.TrimSpace(suffix)

	if subject == "" {
		if suffix == "" {
			return contactMailPrefix + "お問い合わせ"
		}
		return contactMailPrefix + "お問い合わせ" + suffix
	}

	if strings.HasPrefix(subject, contactMailPrefix) {
		if suffix == "" {
			return subject
		}
		return subject + " " + suffix
	}

	if suffix == "" {
		return contactMailPrefix + subject
	}

	return contactMailPrefix + subject + " " + suffix
}

type adminNotification struct {
	subject string
	body    string
}

const adminNotificationTimeout = 10 * time.Second

func (s *Service) notifyAdminUsersAsync(adminUsers []domainauth.AdminUser, notification adminNotification) {
	if s.mailer == nil || len(adminUsers) == 0 {
		return
	}

	go func(adminUsers []domainauth.AdminUser, subject, bodyText string) {
		defer func() {
			if recovered := recover(); recovered != nil {
				slog.Error("panic while sending contact notification email", "panic", recovered)
			}
		}()

		var wg sync.WaitGroup
		for _, admin := range adminUsers {
			if strings.TrimSpace(admin.Email) == "" {
				continue
			}
			wg.Add(1)
			go func(email string) {
				defer wg.Done()
				defer func() {
					if recovered := recover(); recovered != nil {
						slog.Error("panic while sending contact notification email", "email", email, "panic", recovered)
					}
				}()
				ctx, cancel := context.WithTimeout(context.Background(), adminNotificationTimeout)
				defer cancel()
				if err := s.mailer.SendReplyEmail(ctx, email, subject, bodyText); err != nil {
					slog.Error("failed to send contact notification email to admin", "email", email, "error", err)
				}
			}(admin.Email)
		}
		wg.Wait()
	}(append([]domainauth.AdminUser(nil), adminUsers...), notification.subject, notification.body)
}

func buildNewInquiryNotification(message domaincontact.Message, siteBaseURL string) adminNotification {
	adminURL := ""
	if siteBaseURL != "" {
		adminURL = fmt.Sprintf("%s/admin/contact/%d", siteBaseURL, message.ID)
	}

	lines := []string{
		"ふくにしファームの管理者様",
		"",
		"ウェブサイトより新しいお問い合わせがありました。",
		"",
		"■ お問い合わせ内容",
		"お名前: " + message.Name,
		"メールアドレス: " + message.Email,
		"カテゴリ: " + contactCategoryLabel(message.Category),
		"件名: " + message.Subject,
		"",
		"内容:",
		message.Body,
	}
	if adminURL != "" {
		lines = append(lines, "", "■ 管理者対応URL", adminURL)
	}

	return adminNotification{
		subject: "【ふくにしファーム】新規お問い合わせがありました",
		body:    strings.Join(lines, "\n"),
	}
}

func buildCustomerReplyNotification(message domaincontact.Message, body, siteBaseURL string) adminNotification {
	replyURL := ""
	if siteBaseURL != "" {
		replyURL = siteBaseURL + "/contact/" + message.ThreadID
	}

	replyTime := time.Now().In(time.FixedZone("JST", 9*60*60)).Format("2006/01/02 15:04:05")

	subject := subjectWithPrefix(message.Subject, "への新しい返信がありました")

	lines := []string{
		"ふくにしファームの管理者様",
		"",
		"お客様からお問い合わせスレッドに新しい返信がありました。",
		"",
		"■ 返信日時",
		replyTime,
		"",
		"■ お問い合わせ内容",
		"お名前: " + message.Name,
		"メールアドレス: " + message.Email,
		"件名: " + message.Subject,
		"カテゴリ: " + contactCategoryLabel(message.Category),
		"",
		"■ 返信内容",
		body,
	}
	if replyURL != "" {
		lines = append(lines, "", "■ スレッドURL", replyURL)
	}

	return adminNotification{
		subject: subject,
		body:    strings.Join(lines, "\n"),
	}
}
