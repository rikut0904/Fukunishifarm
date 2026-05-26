package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"

	domainauth "fukunishifarm/backend/internal/domain/auth"
)

var (
	ErrInvalidInput = errors.New("invalid input")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
)

type Service struct {
	authenticator domainauth.PasswordAuthenticator
	verifier      domainauth.TokenVerifier
	creator       domainauth.AccountCreator
	session       domainauth.SessionManager
	repository    domainauth.Repository
}

type LoginSession struct {
	Token string
	User  *domainauth.AdminUser
}

func NewService(authenticator domainauth.PasswordAuthenticator, verifier domainauth.TokenVerifier, creator domainauth.AccountCreator, session domainauth.SessionManager, repository domainauth.Repository) *Service {
	return &Service{
		authenticator: authenticator,
		verifier:      verifier,
		creator:       creator,
		session:       session,
		repository:    repository,
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

	user, err := s.repository.UpsertAdminUser(ctx, identity)
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

func (s *Service) CreateUser(ctx context.Context, sessionToken, email, password, displayName string) (*domainauth.AdminUser, error) {
	if strings.TrimSpace(sessionToken) == "" {
		return nil, ErrUnauthorized
	}
	if strings.TrimSpace(email) == "" || strings.TrimSpace(password) == "" {
		return nil, ErrInvalidInput
	}

	if _, err := s.GetSession(ctx, sessionToken); err != nil {
		return nil, err
	}

	identity, err := s.creator.CreateUser(ctx, email, password, displayName)
	if err != nil {
		return nil, fmt.Errorf("create firebase user: %w", err)
	}

	user, err := s.repository.UpsertAdminUser(ctx, identity)
	if err != nil {
		return nil, fmt.Errorf("upsert created user: %w", err)
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
