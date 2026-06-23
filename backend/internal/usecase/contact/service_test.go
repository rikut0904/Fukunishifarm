package contact

import (
	"context"
	"errors"
	"strings"
	"testing"

	domainauth "fukunishifarm/backend/internal/domain/auth"
	domaincontact "fukunishifarm/backend/internal/domain/contact"
)

type fakeContactRepository struct {
	savedMessage domaincontact.Message
	message      domaincontact.Message
	messageErr   error
}

func (r *fakeContactRepository) CreateMessage(ctx context.Context, message domaincontact.Message) (domaincontact.Message, error) {
	r.savedMessage = message
	message.ID = 42
	return message, nil
}

func (r *fakeContactRepository) ListMessages(ctx context.Context, status string, offset, limit int) ([]domaincontact.Message, int64, error) {
	return nil, 0, nil
}

func (r *fakeContactRepository) GetMessage(ctx context.Context, id uint) (domaincontact.Message, error) {
	if r.messageErr != nil {
		return domaincontact.Message{}, r.messageErr
	}
	return r.message, nil
}

func (r *fakeContactRepository) GetMessageByThreadID(ctx context.Context, threadID string) (domaincontact.Message, error) {
	if r.messageErr != nil {
		return domaincontact.Message{}, r.messageErr
	}
	return r.message, nil
}

func (r *fakeContactRepository) UpdateMessageStatus(ctx context.Context, id uint, status string) error {
	return nil
}

func (r *fakeContactRepository) CreateReply(ctx context.Context, reply domaincontact.Reply) (domaincontact.Reply, error) {
	reply.ID = 99
	r.savedMessage = domaincontact.Message{
		ID:       reply.MessageID,
		ThreadID: reply.ThreadID,
	}
	return reply, nil
}

func (r *fakeContactRepository) ListReplies(ctx context.Context, messageID uint) ([]domaincontact.Reply, error) {
	return nil, nil
}

type fakeAdminRepository struct {
	users []domainauth.AdminUser
	err   error
}

func (r *fakeAdminRepository) UpsertAdminUser(ctx context.Context, identity domainauth.VerifiedIdentity) (*domainauth.AdminUser, error) {
	return nil, nil
}

func (r *fakeAdminRepository) FindAdminUserByFirebaseUID(ctx context.Context, firebaseUID string) (*domainauth.AdminUser, error) {
	return nil, nil
}

func (r *fakeAdminRepository) ListAdminUsers(ctx context.Context) ([]domainauth.AdminUser, error) {
	if r.err != nil {
		return nil, r.err
	}
	return r.users, nil
}

type fakeMailSender struct {
	calls []mailCall
	err   error
}

type mailCall struct {
	toEmail string
	subject string
	body    string
}

func (s *fakeMailSender) SendReplyEmail(ctx context.Context, toEmail, subject, body string) error {
	s.calls = append(s.calls, mailCall{
		toEmail: toEmail,
		subject: subject,
		body:    body,
	})
	return s.err
}

func TestSubmitMessageSendsNotificationToAllAdmins(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{}
	adminRepo := &fakeAdminRepository{
		users: []domainauth.AdminUser{
			{Email: "admin1@example.com"},
			{Email: "admin2@example.com"},
		},
	}
	mailer := &fakeMailSender{}
	service := NewService(repo, adminRepo, mailer, "https://example.com/")

	saved, err := service.SubmitMessage(context.Background(), domaincontact.Message{
		Name:     "山田 太郎",
		Email:    "taro@example.com",
		Category: "general",
		Subject:  "お問い合わせ",
		Body:     "内容です",
	})
	if err != nil {
		t.Fatalf("SubmitMessage returned error: %v", err)
	}

	if saved.ID != 42 {
		t.Fatalf("saved ID = %d, want 42", saved.ID)
	}
	if saved.ThreadID == "" {
		t.Fatal("saved ThreadID is empty")
	}

	if got := len(mailer.calls); got != 2 {
		t.Fatalf("mail call count = %d, want 2", got)
	}

	for _, call := range mailer.calls {
		if call.subject != "【ふくにしファーム】新規お問い合わせがありました" {
			t.Fatalf("subject = %q, want contact notification subject", call.subject)
		}
		if call.toEmail != "admin1@example.com" && call.toEmail != "admin2@example.com" {
			t.Fatalf("unexpected recipient: %s", call.toEmail)
		}
		if !strings.Contains(call.body, "お名前: 山田 太郎") {
			t.Fatalf("body does not contain sender name: %s", call.body)
		}
		if !strings.Contains(call.body, "メールアドレス: taro@example.com") {
			t.Fatalf("body does not contain sender email: %s", call.body)
		}
		if !strings.Contains(call.body, "https://example.com/admin/contact/42") {
			t.Fatalf("body does not contain admin URL: %s", call.body)
		}
	}
}

func TestSubmitMessageContinuesWhenAdminListFails(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{}
	adminRepo := &fakeAdminRepository{err: errors.New("db unavailable")}
	mailer := &fakeMailSender{}
	service := NewService(repo, adminRepo, mailer, "https://example.com")

	saved, err := service.SubmitMessage(context.Background(), domaincontact.Message{
		Name:    "山田 太郎",
		Email:   "taro@example.com",
		Subject: "お問い合わせ",
		Body:    "内容です",
	})
	if err != nil {
		t.Fatalf("SubmitMessage returned error: %v", err)
	}

	if saved.ID != 42 {
		t.Fatalf("saved ID = %d, want 42", saved.ID)
	}
	if got := len(mailer.calls); got != 0 {
		t.Fatalf("mail call count = %d, want 0", got)
	}
}

func TestSubmitMessageNormalizesEmailAddress(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{}
	service := NewService(repo, &fakeAdminRepository{}, nil, "https://example.com")

	_, err := service.SubmitMessage(context.Background(), domaincontact.Message{
		Name:    "山田 太郎",
		Email:   "Taro Yamada <taro@example.com>",
		Subject: "お問い合わせ",
		Body:    "内容です",
	})
	if err != nil {
		t.Fatalf("SubmitMessage returned error: %v", err)
	}

	if got := repo.savedMessage.Email; got != "taro@example.com" {
		t.Fatalf("saved email = %q, want %q", got, "taro@example.com")
	}
}

func TestReplyMessageReturnsErrorWhenMailSendFails(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:      42,
			ThreadID: "thread-42",
			Name:    "問い合わせ者",
			Email:   "customer@example.com",
			Subject: "お問い合わせ",
		},
	}
	mailer := &fakeMailSender{err: errors.New("ses send failed")}
	service := NewService(repo, &fakeAdminRepository{}, mailer, "https://example.com")

	saved, err := service.ReplyMessage(context.Background(), 42, ReplyAuthor{
		UserID: 1,
		Name:   "運営",
		Email:  "admin@example.com",
	}, "返信内容")
	if err == nil {
		t.Fatal("ReplyMessage returned nil error, want error")
	}
	if !strings.Contains(err.Error(), "send contact reply email") {
		t.Fatalf("error = %q, want send contact reply email wrapper", err.Error())
	}
	if saved.Message != "返信内容" {
		t.Fatalf("saved reply body = %q, want %q", saved.Message, "返信内容")
	}
	if got := len(mailer.calls); got != 1 {
		t.Fatalf("mail call count = %d, want 1", got)
	}
}
