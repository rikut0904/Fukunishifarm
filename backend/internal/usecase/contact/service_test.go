package contact

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	domainauth "fukunishifarm/backend/internal/domain/auth"
	domaincontact "fukunishifarm/backend/internal/domain/contact"
)

type fakeContactRepository struct {
	savedMessage             domaincontact.Message
	savedReply               domaincontact.Reply
	message                  domaincontact.Message
	messageErr               error
	getMessageCalls          int
	createReplyErr           error
	messageStatusErr         error
	statuses                 []string
	messageStatuses          []string
	replyStatusCtxCanceled   []bool
	messageStatusCtxCanceled []bool
	replyStatusHasDeadline   []bool
	messageStatusHasDeadline []bool
	replyStatuses            []string
	listOffset               int
	listLimit                int
}

func (r *fakeContactRepository) CreateMessage(ctx context.Context, message domaincontact.Message) (domaincontact.Message, error) {
	r.savedMessage = message
	message.ID = 42
	return message, nil
}

func (r *fakeContactRepository) ListMessages(ctx context.Context, status string, offset, limit int) ([]domaincontact.Message, int64, error) {
	r.listOffset = offset
	r.listLimit = limit
	return nil, 0, nil
}

func (r *fakeContactRepository) GetMessage(ctx context.Context, id uint) (domaincontact.Message, error) {
	r.getMessageCalls++
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
	r.messageStatuses = append(r.messageStatuses, status)
	r.messageStatusCtxCanceled = append(r.messageStatusCtxCanceled, ctx.Err() != nil)
	_, hasDeadline := ctx.Deadline()
	r.messageStatusHasDeadline = append(r.messageStatusHasDeadline, hasDeadline)
	if r.messageStatusErr != nil {
		return r.messageStatusErr
	}
	return nil
}

func (r *fakeContactRepository) CreateReply(ctx context.Context, reply domaincontact.Reply) (domaincontact.Reply, error) {
	if r.createReplyErr != nil {
		return domaincontact.Reply{}, r.createReplyErr
	}
	reply.ID = 99
	r.savedReply = reply
	return reply, nil
}

func (r *fakeContactRepository) UpdateReplyStatus(ctx context.Context, id uint, status string) error {
	r.replyStatuses = append(r.replyStatuses, status)
	r.replyStatusCtxCanceled = append(r.replyStatusCtxCanceled, ctx.Err() != nil)
	_, hasDeadline := ctx.Deadline()
	r.replyStatusHasDeadline = append(r.replyStatusHasDeadline, hasDeadline)
	if r.savedReply.ID == id {
		r.savedReply.Status = status
	}
	return nil
}

func (r *fakeContactRepository) CreateReplyAndUpdateMessageStatus(ctx context.Context, reply domaincontact.Reply, status string) (domaincontact.Reply, error) {
	r.statuses = append(r.statuses, status)
	reply.Status = "sent"
	return r.CreateReply(ctx, reply)
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
	mu    sync.Mutex
	calls []mailCall
	err   error
}

type panicMailSender struct{}

type cancelingMailSender struct {
	cancel func()
}

type mailCall struct {
	toEmail string
	subject string
	body    string
}

func (s *fakeMailSender) SendReplyEmail(ctx context.Context, toEmail, subject, body string) error {
	s.mu.Lock()
	s.calls = append(s.calls, mailCall{
		toEmail: toEmail,
		subject: subject,
		body:    body,
	})
	s.mu.Unlock()
	return s.err
}

func (s *fakeMailSender) callCount() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.calls)
}

func (s *fakeMailSender) snapshot() []mailCall {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]mailCall(nil), s.calls...)
}

func (s *panicMailSender) SendReplyEmail(ctx context.Context, toEmail, subject, body string) error {
	panic("boom")
}

func (s *cancelingMailSender) SendReplyEmail(ctx context.Context, toEmail, subject, body string) error {
	if s.cancel != nil {
		s.cancel()
	}
	return nil
}

func waitForMailCalls(t *testing.T, sender *fakeMailSender, want int) {
	t.Helper()

	deadline := time.After(500 * time.Millisecond)
	ticker := time.NewTicker(10 * time.Millisecond)
	defer ticker.Stop()

	for {
		if sender.callCount() >= want {
			return
		}

		select {
		case <-deadline:
			t.Fatalf("mail call count = %d, want at least %d", sender.callCount(), want)
		case <-ticker.C:
		}
	}
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

	waitForMailCalls(t, mailer, 2)

	if got := mailer.callCount(); got != 2 {
		t.Fatalf("mail call count = %d, want 2", got)
	}

	for _, call := range mailer.snapshot() {
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
		if !strings.Contains(call.body, "カテゴリ: 一般") {
			t.Fatalf("body does not contain localized category label: %s", call.body)
		}
		if !strings.Contains(call.body, "https://example.com/admin/contact/42") {
			t.Fatalf("body does not contain admin URL: %s", call.body)
		}
	}
}

func TestSubmitMessageRecoversFromNotificationPanic(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{}
	adminRepo := &fakeAdminRepository{
		users: []domainauth.AdminUser{
			{Email: "admin@example.com"},
		},
	}
	service := NewService(repo, adminRepo, &panicMailSender{}, "https://example.com")

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
	if got := mailer.callCount(); got != 0 {
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

func TestSubmitMessageRejectsInvalidCategory(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{}
	service := NewService(repo, &fakeAdminRepository{}, nil, "https://example.com")

	_, err := service.SubmitMessage(context.Background(), domaincontact.Message{
		Name:     "山田 太郎",
		Email:    "taro@example.com",
		Category: "invalid-category",
		Subject:  "お問い合わせ",
		Body:     "内容です",
	})
	if !errors.Is(err, domaincontact.ErrInvalidInput) {
		t.Fatalf("error = %v, want ErrInvalidInput", err)
	}
}

func TestListMessagesClampsLimitToMaximum(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{}
	service := NewService(repo, &fakeAdminRepository{}, nil, "https://example.com")

	_, _, err := service.ListMessages(context.Background(), "all", 1, 1000)
	if err != nil {
		t.Fatalf("ListMessages returned error: %v", err)
	}

	if got := repo.listLimit; got != 100 {
		t.Fatalf("list limit = %d, want 100", got)
	}
}

func TestSubmitMessageAcceptsAllowedCategories(t *testing.T) {
	t.Parallel()

	allowed := []string{"grape", "price", "access", "reservation", "other", "general"}
	for _, category := range allowed {
		category := category
		t.Run(category, func(t *testing.T) {
			t.Parallel()

			repo := &fakeContactRepository{}
			service := NewService(repo, &fakeAdminRepository{}, nil, "https://example.com")

			_, err := service.SubmitMessage(context.Background(), domaincontact.Message{
				Name:     "山田 太郎",
				Email:    "taro@example.com",
				Category: category,
				Subject:  "お問い合わせ",
				Body:     "内容です",
			})
			if err != nil {
				t.Fatalf("SubmitMessage returned error: %v", err)
			}
		})
	}
}

func TestSubmitMessageRejectsOverlyLongFields(t *testing.T) {
	tests := []struct {
		name  string
		input domaincontact.Message
	}{
		{
			name: "name",
			input: domaincontact.Message{
				Name:     strings.Repeat("あ", 81),
				Email:    "taro@example.com",
				Category: "general",
				Subject:  "お問い合わせ",
				Body:     "内容です",
			},
		},
		{
			name: "email",
			input: domaincontact.Message{
				Name:     "山田 太郎",
				Email:    strings.Repeat("a", 321) + "@example.com",
				Category: "general",
				Subject:  "お問い合わせ",
				Body:     "内容です",
			},
		},
		{
			name: "subject",
			input: domaincontact.Message{
				Name:     "山田 太郎",
				Email:    "taro@example.com",
				Category: "general",
				Subject:  strings.Repeat("件", 161),
				Body:     "内容です",
			},
		},
		{
			name: "body",
			input: domaincontact.Message{
				Name:     "山田 太郎",
				Email:    "taro@example.com",
				Category: "general",
				Subject:  "お問い合わせ",
				Body:     strings.Repeat("内", 65536),
			},
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			repo := &fakeContactRepository{}
			service := NewService(repo, &fakeAdminRepository{}, nil, "https://example.com")
			_, err := service.SubmitMessage(context.Background(), tc.input)
			if !errors.Is(err, domaincontact.ErrInvalidInput) {
				t.Fatalf("error = %v, want ErrInvalidInput", err)
			}
			if repo.savedMessage.ID != 0 {
				t.Fatalf("message should not be saved for %s", tc.name)
			}
		})
	}
}

func TestReplyMessageReturnsErrorWhenMailSendFails(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "お問い合わせ",
			Status:   "pending",
		},
	}
	mailer := &fakeMailSender{err: errors.New("ses send failed")}
	service := NewService(repo, &fakeAdminRepository{}, mailer, "https://example.com")

	_, err := service.ReplyMessage(context.Background(), 42, ReplyAuthor{
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
	waitForMailCalls(t, mailer, 1)
	if got := mailer.callCount(); got != 1 {
		t.Fatalf("mail call count = %d, want 1", got)
	}
	if repo.savedReply.ID == 0 {
		t.Fatalf("reply should be saved before mail send")
	}
	if repo.savedReply.Status != "failed" {
		t.Fatalf("reply status = %q, want %q", repo.savedReply.Status, "failed")
	}
	if len(repo.replyStatuses) != 1 || repo.replyStatuses[0] != "failed" {
		t.Fatalf("reply status updates = %v, want [failed]", repo.replyStatuses)
	}
}

func TestReplyMessageMarksReplySentAfterMailSend(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "お問い合わせ",
			Status:   "pending",
		},
	}
	mailer := &fakeMailSender{}
	service := NewService(repo, &fakeAdminRepository{}, mailer, "https://example.com")

	saved, err := service.ReplyMessage(context.Background(), 42, ReplyAuthor{
		UserID: 1,
		Name:   "運営",
		Email:  "admin@example.com",
	}, "返信内容")
	if err != nil {
		t.Fatalf("ReplyMessage returned error: %v", err)
	}
	waitForMailCalls(t, mailer, 1)
	if got := mailer.callCount(); got != 1 {
		t.Fatalf("mail call count = %d, want 1", got)
	}
	if saved.ID == 0 {
		t.Fatalf("saved reply ID = %d, want non-zero", saved.ID)
	}
	if saved.Status != "sent" {
		t.Fatalf("saved reply status = %q, want %q", saved.Status, "sent")
	}
	if repo.savedReply.Status != "sent" {
		t.Fatalf("reply status = %q, want %q", repo.savedReply.Status, "sent")
	}
	if len(repo.replyStatuses) != 1 || repo.replyStatuses[0] != "sent" {
		t.Fatalf("reply status updates = %v, want [sent]", repo.replyStatuses)
	}
	if len(repo.messageStatuses) != 1 || repo.messageStatuses[0] != "in_progress" {
		t.Fatalf("message status updates = %v, want [in_progress]", repo.messageStatuses)
	}
}

func TestReplyMessageUsesIndependentContextForDbUpdatesAfterMailSend(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "お問い合わせ",
			Status:   "pending",
		},
	}
	ctx, cancel := context.WithCancel(context.Background())
	mailer := &cancelingMailSender{cancel: cancel}
	service := NewService(repo, &fakeAdminRepository{}, mailer, "https://example.com")

	saved, err := service.ReplyMessage(ctx, 42, ReplyAuthor{
		UserID: 1,
		Name:   "運営",
		Email:  "admin@example.com",
	}, "返信内容")
	if err != nil {
		t.Fatalf("ReplyMessage returned error: %v", err)
	}
	if saved.Status != "sent" {
		t.Fatalf("saved reply status = %q, want %q", saved.Status, "sent")
	}
	if len(repo.replyStatusCtxCanceled) != 1 || repo.replyStatusCtxCanceled[0] {
		t.Fatalf("reply status ctx canceled = %v, want [false]", repo.replyStatusCtxCanceled)
	}
	if len(repo.replyStatusHasDeadline) != 1 || !repo.replyStatusHasDeadline[0] {
		t.Fatalf("reply status ctx deadline set = %v, want [true]", repo.replyStatusHasDeadline)
	}
	if len(repo.messageStatusCtxCanceled) != 1 || repo.messageStatusCtxCanceled[0] {
		t.Fatalf("message status ctx canceled = %v, want [false]", repo.messageStatusCtxCanceled)
	}
	if len(repo.messageStatusHasDeadline) != 1 || !repo.messageStatusHasDeadline[0] {
		t.Fatalf("message status ctx deadline set = %v, want [true]", repo.messageStatusHasDeadline)
	}
}

func TestReplyMessageIgnoresMessageStatusUpdateFailureAfterMailSend(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "お問い合わせ",
			Status:   "pending",
		},
		messageStatusErr: errors.New("db update failed"),
	}
	mailer := &fakeMailSender{}
	service := NewService(repo, &fakeAdminRepository{}, mailer, "https://example.com")

	saved, err := service.ReplyMessage(context.Background(), 42, ReplyAuthor{
		UserID: 1,
		Name:   "運営",
		Email:  "admin@example.com",
	}, "返信内容")
	if err != nil {
		t.Fatalf("ReplyMessage returned error: %v", err)
	}
	waitForMailCalls(t, mailer, 1)
	if saved.ID == 0 {
		t.Fatalf("saved reply ID = %d, want non-zero", saved.ID)
	}
	if repo.savedReply.Status != "sent" {
		t.Fatalf("reply status = %q, want %q", repo.savedReply.Status, "sent")
	}
	if len(repo.messageStatuses) != 1 || repo.messageStatuses[0] != "in_progress" {
		t.Fatalf("message status updates = %v, want [in_progress]", repo.messageStatuses)
	}
}

func TestReplyMessageReturnsErrorWhenReplyCreateFails(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "お問い合わせ",
		},
		createReplyErr: errors.New("db insert failed"),
	}
	mailer := &fakeMailSender{}
	service := NewService(repo, &fakeAdminRepository{}, mailer, "https://example.com")

	_, err := service.ReplyMessage(context.Background(), 42, ReplyAuthor{
		UserID: 1,
		Name:   "運営",
		Email:  "admin@example.com",
	}, "返信内容")
	if err == nil {
		t.Fatal("ReplyMessage returned nil error, want error")
	}
	if !strings.Contains(err.Error(), "create contact reply") {
		t.Fatalf("error = %q, want create contact reply wrapper", err.Error())
	}
	if got := mailer.callCount(); got != 0 {
		t.Fatalf("mail call count = %d, want 0", got)
	}
	if repo.savedReply.ID != 0 {
		t.Fatalf("reply should not be saved when create fails")
	}
}

func TestReplyMessageReturnsErrorWhenMailerIsNotConfigured(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "お問い合わせ",
		},
	}
	service := NewService(repo, &fakeAdminRepository{}, nil, "https://example.com")

	_, err := service.ReplyMessage(context.Background(), 42, ReplyAuthor{
		UserID: 1,
		Name:   "運営",
		Email:  "admin@example.com",
	}, "返信内容")
	if !errors.Is(err, domaincontact.ErrMailNotConfigured) {
		t.Fatalf("error = %v, want ErrMailNotConfigured", err)
	}
	if repo.getMessageCalls != 0 {
		t.Fatalf("get message calls = %d, want 0", repo.getMessageCalls)
	}
	if repo.savedReply.ID != 0 {
		t.Fatalf("reply should not be saved when mailer is nil")
	}
}

func TestReplyThreadReopensThreadAsInProgress(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Status:   "resolved",
		},
	}
	service := NewService(repo, &fakeAdminRepository{}, nil, "https://example.com")

	saved, err := service.ReplyThread(context.Background(), "thread-42", "新しい返信です")
	if err != nil {
		t.Fatalf("ReplyThread returned error: %v", err)
	}

	if len(repo.statuses) != 1 {
		t.Fatalf("status update count = %d, want 1", len(repo.statuses))
	}
	if got := repo.statuses[0]; got != "in_progress" {
		t.Fatalf("status = %q, want %q", got, "in_progress")
	}
	if saved.Message != "新しい返信です" {
		t.Fatalf("saved reply body = %q, want %q", saved.Message, "新しい返信です")
	}
}

func TestReplyThreadSendsNotificationToAdmins(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "お問い合わせ",
			Category: "general",
		},
	}
	adminRepo := &fakeAdminRepository{
		users: []domainauth.AdminUser{
			{Email: "admin@example.com"},
		},
	}
	mailer := &fakeMailSender{}
	service := NewService(repo, adminRepo, mailer, "https://example.com")

	_, err := service.ReplyThread(context.Background(), "thread-42", "新しい返信です")
	if err != nil {
		t.Fatalf("ReplyThread returned error: %v", err)
	}

	waitForMailCalls(t, mailer, 1)

	if got := mailer.callCount(); got != 1 {
		t.Fatalf("mail call count = %d, want 1", got)
	}

	call := mailer.snapshot()[0]
	if call.toEmail != "admin@example.com" {
		t.Fatalf("recipient = %q, want %q", call.toEmail, "admin@example.com")
	}
	if !strings.Contains(call.subject, "お問い合わせ") {
		t.Fatalf("subject = %q, want to contain inquiry subject", call.subject)
	}
	if !strings.Contains(call.body, "返信日時") {
		t.Fatalf("body does not contain reply timestamp: %s", call.body)
	}
	if !strings.Contains(call.body, "新しい返信です") {
		t.Fatalf("body does not contain reply content: %s", call.body)
	}
	if !strings.Contains(call.body, "カテゴリ: 一般") {
		t.Fatalf("body does not contain localized category label: %s", call.body)
	}
	if !strings.Contains(call.body, "https://example.com/contact/thread-42") {
		t.Fatalf("body does not contain thread URL: %s", call.body)
	}
}

func TestReplyMessageDoesNotDuplicateSubjectPrefix(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "【ふくにしファーム】お問い合わせ",
		},
	}
	mailer := &fakeMailSender{}
	service := NewService(repo, &fakeAdminRepository{}, mailer, "https://example.com")

	_, err := service.ReplyMessage(context.Background(), 42, ReplyAuthor{
		UserID: 1,
		Name:   "運営",
		Email:  "admin@example.com",
	}, "返信内容")
	if err != nil {
		t.Fatalf("ReplyMessage returned error: %v", err)
	}

	waitForMailCalls(t, mailer, 1)

	call := mailer.snapshot()[0]
	if strings.Count(call.subject, "【ふくにしファーム】") != 1 {
		t.Fatalf("subject = %q, want prefix only once", call.subject)
	}
}

func TestReplyThreadDoesNotDuplicateSubjectPrefix(t *testing.T) {
	t.Parallel()

	repo := &fakeContactRepository{
		message: domaincontact.Message{
			ID:       42,
			ThreadID: "thread-42",
			Name:     "問い合わせ者",
			Email:    "customer@example.com",
			Subject:  "【ふくにしファーム】お問い合わせ",
			Category: "general",
		},
	}
	adminRepo := &fakeAdminRepository{
		users: []domainauth.AdminUser{{Email: "admin@example.com"}},
	}
	mailer := &fakeMailSender{}
	service := NewService(repo, adminRepo, mailer, "https://example.com")

	_, err := service.ReplyThread(context.Background(), "thread-42", "新しい返信です")
	if err != nil {
		t.Fatalf("ReplyThread returned error: %v", err)
	}

	waitForMailCalls(t, mailer, 1)

	call := mailer.snapshot()[0]
	if strings.Count(call.subject, "【ふくにしファーム】") != 1 {
		t.Fatalf("subject = %q, want prefix only once", call.subject)
	}
}
