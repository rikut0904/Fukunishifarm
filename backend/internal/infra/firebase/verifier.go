package firebaseauth

import (
	"context"
	"fmt"
	"strings"

	firebase "firebase.google.com/go/v4"
	fbauth "firebase.google.com/go/v4/auth"
	domainauth "fukunishifarm/backend/internal/domain/auth"
	"google.golang.org/api/option"
)

type Verifier struct {
	client *fbauth.Client
}

func NewVerifier(ctx context.Context, projectID, serviceAccountJSON string) (*Verifier, error) {
	if projectID == "" {
		return nil, fmt.Errorf("FIREBASE_PROJECT_ID is required")
	}
	if serviceAccountJSON == "" {
		return nil, fmt.Errorf("FIREBASE_SERVICE_ACCOUNT_JSON is required")
	}

	app, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: projectID}, option.WithCredentialsJSON([]byte(serviceAccountJSON)))
	if err != nil {
		return nil, sanitizeCredentialError(err)
	}

	client, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("create firebase auth client: %w", err)
	}

	return &Verifier{client: client}, nil
}

func sanitizeCredentialError(err error) error {
	if err == nil {
		return nil
	}

	message := strings.ToLower(err.Error())
	if strings.Contains(message, "private_key") || strings.Contains(message, "private key") || strings.Contains(message, "begin private key") {
		return fmt.Errorf("initialize firebase app: invalid FIREBASE_SERVICE_ACCOUNT_JSON")
	}

	return fmt.Errorf("initialize firebase app: %w", err)
}

func (v *Verifier) VerifyIDToken(ctx context.Context, token string) (domainauth.VerifiedIdentity, error) {
	decoded, err := v.client.VerifyIDToken(ctx, token)
	if err != nil {
		return domainauth.VerifiedIdentity{}, fmt.Errorf("verify firebase token: %w", err)
	}

	email, _ := decoded.Claims["email"].(string)
	displayName, _ := decoded.Claims["name"].(string)
	photoURL, _ := decoded.Claims["picture"].(string)

	if email == "" {
		return domainauth.VerifiedIdentity{}, fmt.Errorf("firebase token does not contain an email")
	}

	return domainauth.VerifiedIdentity{
		FirebaseUID: decoded.UID,
		Email:       email,
		DisplayName: displayName,
		PhotoURL:    photoURL,
	}, nil
}

func (v *Verifier) CreateUser(ctx context.Context, email, password, displayName string) (domainauth.VerifiedIdentity, error) {
	params := (&fbauth.UserToCreate{}).
		Email(email)
	if password != "" {
		params = params.Password(password)
	}
	if displayName != "" {
		params = params.DisplayName(displayName)
	}

	user, err := v.client.CreateUser(ctx, params)
	if err != nil {
		if fbauth.IsEmailAlreadyExists(err) {
			return domainauth.VerifiedIdentity{}, domainauth.ErrEmailAlreadyExists
		}
		return domainauth.VerifiedIdentity{}, fmt.Errorf("create firebase user: %w", err)
	}

	return domainauth.VerifiedIdentity{
		FirebaseUID: user.UID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		PhotoURL:    user.PhotoURL,
	}, nil
}

func (v *Verifier) CreateInvitedUser(ctx context.Context, email, displayName string) (domainauth.VerifiedIdentity, error) {
	return v.CreateUser(ctx, email, "", displayName)
}

func (v *Verifier) DeleteUser(ctx context.Context, firebaseUID string) error {
	firebaseUID = strings.TrimSpace(firebaseUID)
	if firebaseUID == "" {
		return fmt.Errorf("firebase uid is required")
	}

	if err := v.client.DeleteUser(ctx, firebaseUID); err != nil {
		if fbauth.IsUserNotFound(err) {
			return nil
		}
		return fmt.Errorf("delete firebase user: %w", err)
	}

	return nil
}

func (v *Verifier) GeneratePasswordSetupLink(ctx context.Context, email, continueURL string) (string, error) {
	email = strings.TrimSpace(email)
	continueURL = strings.TrimSpace(continueURL)
	if email == "" {
		return "", fmt.Errorf("email is required")
	}
	if continueURL == "" {
		return "", fmt.Errorf("continue URL is required")
	}

	link, err := v.client.PasswordResetLinkWithSettings(ctx, email, &fbauth.ActionCodeSettings{
		URL: continueURL,
	})
	if err != nil {
		return "", fmt.Errorf("generate password setup link: %w", err)
	}

	return link, nil
}
