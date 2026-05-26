package firebaseauth

import (
	"context"
	"fmt"

	firebase "firebase.google.com/go/v4"
	firebaseauth "firebase.google.com/go/v4/auth"
	domainauth "fukunishifarm/backend/internal/domain/auth"
	"google.golang.org/api/option"
)

type Verifier struct {
	client *firebaseauth.Client
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
		return nil, fmt.Errorf("initialize firebase app: %w", err)
	}

	client, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("create firebase auth client: %w", err)
	}

	return &Verifier{client: client}, nil
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
	params := (&firebaseauth.UserToCreate{}).
		Email(email).
		Password(password)
	if displayName != "" {
		params = params.DisplayName(displayName)
	}

	user, err := v.client.CreateUser(ctx, params)
	if err != nil {
		return domainauth.VerifiedIdentity{}, fmt.Errorf("create firebase user: %w", err)
	}

	return domainauth.VerifiedIdentity{
		FirebaseUID: user.UID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		PhotoURL:    user.PhotoURL,
	}, nil
}
