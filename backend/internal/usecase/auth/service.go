package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"strings"
	"time"

	domainauth "fukunishifarm/backend/internal/domain/auth"
)

var (
	ErrInvalidInput = errors.New("invalid input")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
)

const rollbackInviteTimeout = 10 * time.Second

type Service struct {
	authenticator domainauth.PasswordAuthenticator
	verifier      domainauth.TokenVerifier
	creator       domainauth.AccountCreator
	session       domainauth.SessionManager
	repository    domainauth.Repository
	mailer        domainauth.InvitationEmailSender
	loginURL      string
}

type LoginSession struct {
	Token string
	User  *domainauth.AdminUser
}

func NewService(authenticator domainauth.PasswordAuthenticator, verifier domainauth.TokenVerifier, creator domainauth.AccountCreator, session domainauth.SessionManager, repository domainauth.Repository, mailer domainauth.InvitationEmailSender, loginURL string) *Service {
	return &Service{
		authenticator: authenticator,
		verifier:      verifier,
		creator:       creator,
		session:       session,
		repository:    repository,
		mailer:        mailer,
		loginURL:      strings.TrimSpace(loginURL),
	}
}

func (s *Service) LoginAdmin(ctx context.Context, email, password string) (*LoginSession, error) {
	if strings.TrimSpace(email) == "" || strings.TrimSpace(password) == "" {
		return nil, ErrInvalidInput
	}

	loginResult, err := s.authenticator.AuthenticateWithPassword(ctx, email, password)
	if err != nil {
		if errors.Is(err, domainauth.ErrInvalidCredentials) {
			return nil, ErrUnauthorized
		}
		return nil, fmt.Errorf("authenticate with firebase: %w", err)
	}

	identity, err := s.verifier.VerifyIDToken(ctx, loginResult.IDToken)
	if err != nil {
		return nil, fmt.Errorf("verify firebase id token: %w", err)
	}

	user, err := s.repository.UpsertLoginAdminUser(ctx, identity)
	if err != nil {
		return nil, fmt.Errorf("upsert admin user: %w", err)
	}

	token, err := s.session.Issue(ctx, domainauth.SessionClaims{
		FirebaseUID: user.FirebaseUID,
		Email:       user.Email,
		AdminUserID: user.ID,
	})
	if err != nil {
		return nil, fmt.Errorf("issue session token: %w", err)
	}

	return &LoginSession{
		Token: token,
		User:  user,
	}, nil
}

func (s *Service) CreateUser(ctx context.Context, sessionToken, email, displayName string) (*domainauth.AdminUser, error) {
	email = strings.TrimSpace(email)
	displayName = strings.TrimSpace(displayName)

	if strings.TrimSpace(sessionToken) == "" {
		return nil, ErrUnauthorized
	}
	if email == "" {
		return nil, ErrInvalidInput
	}
	if s.mailer == nil || s.loginURL == "" {
		return nil, domainauth.ErrMailNotConfigured
	}

	if _, err := s.GetSession(ctx, sessionToken); err != nil {
		return nil, err
	}

	identity, err := s.creator.CreateInvitedUser(ctx, email, displayName)
	if err != nil {
		return nil, fmt.Errorf("create firebase user: %w", err)
	}

	user, err := s.repository.CreateAdminUser(ctx, identity)
	if err != nil {
		rollbackInvite(ctx, s.creator, s.repository, identity.FirebaseUID)
		return nil, fmt.Errorf("create admin user: %w", err)
	}

	passwordSetupLink, err := s.creator.GeneratePasswordSetupLink(ctx, identity.Email, buildLoginContinueURL(s.loginURL, identity.Email))
	if err != nil {
		rollbackInvite(ctx, s.creator, s.repository, identity.FirebaseUID)
		return nil, fmt.Errorf("generate password setup link: %w", err)
	}

	subject, body := buildInvitationEmail(identity.Email, displayName, passwordSetupLink, s.loginURL)
	if err := s.mailer.SendInvitationEmail(ctx, identity.Email, subject, body); err != nil {
		rollbackInvite(ctx, s.creator, s.repository, identity.FirebaseUID)
		return nil, fmt.Errorf("send invitation email: %w", err)
	}

	return user, nil
}

func (s *Service) GetSession(ctx context.Context, token string) (*domainauth.AdminUser, error) {
	if strings.TrimSpace(token) == "" {
		return nil, ErrInvalidInput
	}

	claims, err := s.session.Verify(ctx, token)
	if err != nil {
		return nil, ErrUnauthorized
	}

	user, err := s.repository.FindAdminUserByFirebaseUID(ctx, claims.FirebaseUID)
	if err != nil {
		if errors.Is(err, domainauth.ErrUserNotFound) {
			return nil, ErrUnauthorized
		}
		return nil, fmt.Errorf("find admin user: %w", err)
	}

	return user, nil
}

func (s *Service) ListUsers(ctx context.Context, sessionToken string) ([]domainauth.AdminUser, error) {
	if strings.TrimSpace(sessionToken) == "" {
		return nil, ErrUnauthorized
	}

	if _, err := s.GetSession(ctx, sessionToken); err != nil {
		return nil, err
	}

	users, err := s.repository.ListAdminUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("list admin users: %w", err)
	}

	return users, nil
}

func (s *Service) ResendInvitation(ctx context.Context, sessionToken string, userID uint) error {
	if strings.TrimSpace(sessionToken) == "" || userID == 0 {
		return ErrInvalidInput
	}
	if s.mailer == nil || s.loginURL == "" {
		return domainauth.ErrMailNotConfigured
	}

	if _, err := s.GetSession(ctx, sessionToken); err != nil {
		return err
	}

	user, err := s.repository.FindAdminUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, domainauth.ErrUserNotFound) {
			return err
		}
		return fmt.Errorf("find admin user by id: %w", err)
	}
	if !user.LastLoginAt.IsZero() {
		return ErrInvalidInput
	}

	passwordSetupLink, err := s.creator.GeneratePasswordSetupLink(ctx, user.Email, buildLoginContinueURL(s.loginURL, user.Email))
	if err != nil {
		return fmt.Errorf("generate password setup link: %w", err)
	}

	subject, body := buildInvitationEmail(user.Email, user.DisplayName, passwordSetupLink, s.loginURL)
	if err := s.mailer.SendInvitationEmail(ctx, user.Email, subject, body); err != nil {
		return fmt.Errorf("send invitation email: %w", err)
	}

	return nil
}

func (s *Service) DeleteUser(ctx context.Context, sessionToken string, userID uint) error {
	if strings.TrimSpace(sessionToken) == "" || userID == 0 {
		return ErrInvalidInput
	}

	currentUser, err := s.GetSession(ctx, sessionToken)
	if err != nil {
		return err
	}
	if currentUser.ID == userID {
		return ErrForbidden
	}

	user, err := s.repository.FindAdminUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, domainauth.ErrUserNotFound) {
			return err
		}
		return fmt.Errorf("find admin user by id: %w", err)
	}

	if err := s.creator.DeleteUser(ctx, user.FirebaseUID); err != nil {
		return fmt.Errorf("delete firebase user: %w", err)
	}
	if err := s.repository.DeleteAdminUserByFirebaseUID(ctx, user.FirebaseUID); err != nil {
		return fmt.Errorf("delete admin user: %w", err)
	}

	return nil
}

func rollbackInvite(_ context.Context, creator domainauth.AccountCreator, repository domainauth.Repository, firebaseUID string) {
	rollbackCtx, cancel := context.WithTimeout(context.Background(), rollbackInviteTimeout)
	defer cancel()

	if creator != nil {
		if err := creator.DeleteUser(rollbackCtx, firebaseUID); err != nil {
			slog.Error("rollback firebase user failed", "firebase_uid", firebaseUID, "error", err)
		}
	}
	if repository != nil {
		if err := repository.DeleteAdminUserByFirebaseUID(rollbackCtx, firebaseUID); err != nil {
			slog.Error("rollback admin user failed", "firebase_uid", firebaseUID, "error", err)
		}
	}
}

func buildLoginContinueURL(loginURL, email string) string {
	requestURL, err := url.Parse(strings.TrimSpace(loginURL))
	if err != nil || requestURL == nil {
		return strings.TrimSpace(loginURL)
	}

	query := requestURL.Query()
	query.Set("email", strings.TrimSpace(email))
	query.Set("invited", "1")
	requestURL.RawQuery = query.Encode()
	return requestURL.String()
}

func buildInvitationEmail(email, displayName, passwordSetupLink, loginURL string) (string, string) {
	name := strings.TrimSpace(displayName)
	if name == "" {
		name = strings.TrimSpace(email)
	}

	subject := "【ふくにしファーム】管理画面への招待"
	body := fmt.Sprintf(`%s 様

ふくにしファーム管理画面へ招待しました。
以下のリンクからパスワードを設定してください。

%s

パスワード設定が完了すると、ログイン画面へ移動します。
ログイン画面:
%s

このメールに心当たりがない場合は破棄してください。`, name, passwordSetupLink, loginURL)

	return subject, body
}
