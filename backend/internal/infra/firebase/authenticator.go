package firebaseauth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	domainauth "fukunishifarm/backend/internal/domain/auth"
)

type Authenticator struct {
	apiKey string
	client *http.Client
}

type firebasePasswordRequest struct {
	Email             string `json:"email"`
	Password          string `json:"password"`
	ReturnSecureToken bool   `json:"returnSecureToken"`
}

type firebasePasswordResponse struct {
	IDToken      string `json:"idToken"`
	Email        string `json:"email"`
	RefreshToken string `json:"refreshToken"`
	LocalID      string `json:"localId"`
	DisplayName  string `json:"displayName"`
	PhotoURL     string `json:"photoUrl"`
	Registered   bool   `json:"registered"`
	ExpiresIn    string `json:"expiresIn"`
	Error        *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func NewAuthenticator(apiKey string) (*Authenticator, error) {
	if strings.TrimSpace(apiKey) == "" {
		return nil, fmt.Errorf("FIREBASE_API_KEY is required")
	}

	return &Authenticator{
		apiKey: apiKey,
		client: http.DefaultClient,
	}, nil
}

func (a *Authenticator) AuthenticateWithPassword(ctx context.Context, email, password string) (domainauth.LoginResult, error) {
	payload := firebasePasswordRequest{
		Email:             email,
		Password:          password,
		ReturnSecureToken: true,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return domainauth.LoginResult{}, fmt.Errorf("marshal firebase auth request: %w", err)
	}

	endpoint := "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + url.QueryEscape(a.apiKey)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return domainauth.LoginResult{}, fmt.Errorf("create firebase auth request: %w", err)
	}
	request.Header.Set("Content-Type", "application/json")

	response, err := a.client.Do(request)
	if err != nil {
		return domainauth.LoginResult{}, fmt.Errorf("call firebase auth endpoint: %w", err)
	}
	defer response.Body.Close()

	var decoded firebasePasswordResponse
	if err := json.NewDecoder(response.Body).Decode(&decoded); err != nil {
		return domainauth.LoginResult{}, fmt.Errorf("decode firebase auth response: %w", err)
	}

	if response.StatusCode >= http.StatusBadRequest {
		message := "firebase authentication failed"
		if decoded.Error != nil && decoded.Error.Message != "" {
			message = decoded.Error.Message
		}
		return domainauth.LoginResult{}, fmt.Errorf("%s", message)
	}

	if decoded.IDToken == "" || decoded.LocalID == "" || decoded.Email == "" {
		return domainauth.LoginResult{}, fmt.Errorf("firebase auth response is incomplete")
	}

	return domainauth.LoginResult{
		VerifiedIdentity: domainauth.VerifiedIdentity{
			FirebaseUID: decoded.LocalID,
			Email:       decoded.Email,
			DisplayName: decoded.DisplayName,
			PhotoURL:    decoded.PhotoURL,
		},
		IDToken: decoded.IDToken,
	}, nil
}
