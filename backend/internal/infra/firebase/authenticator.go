package firebaseauth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
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

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return domainauth.LoginResult{}, fmt.Errorf("read firebase auth response: %w", err)
	}

	if response.StatusCode >= http.StatusBadRequest {
		message := firebaseAuthErrorMessage(responseBody)
		if isInvalidCredentialsError(message) {
			return domainauth.LoginResult{}, domainauth.ErrInvalidCredentials
		}
		if message == "" {
			message = "firebase authentication failed"
		}
		return domainauth.LoginResult{}, fmt.Errorf("firebase auth failed: status %d: %s", response.StatusCode, message)
	}

	var decoded firebasePasswordResponse
	if err := json.Unmarshal(responseBody, &decoded); err != nil {
		return domainauth.LoginResult{}, fmt.Errorf("decode firebase auth response: %w", err)
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

func firebaseAuthErrorMessage(body []byte) string {
	var decoded firebasePasswordResponse
	if err := json.Unmarshal(body, &decoded); err == nil && decoded.Error != nil && decoded.Error.Message != "" {
		return decoded.Error.Message
	}

	trimmed := strings.TrimSpace(string(body))
	if trimmed != "" {
		return trimmed
	}

	return ""
}

func isInvalidCredentialsError(message string) bool {
	upper := strings.ToUpper(strings.TrimSpace(message))
	switch upper {
	case "INVALID_LOGIN_CREDENTIALS",
		"INVALID_PASSWORD",
		"EMAIL_NOT_FOUND",
		"USER_DISABLED",
		"MISSING_PASSWORD",
		"INVALID_EMAIL":
		return true
	default:
		return false
	}
}
