package sessionjwt

import (
	"context"
	"fmt"
	"time"

	"fukunishifarm/backend/internal/domain/auth"
	"github.com/golang-jwt/jwt/v4"
)

type Manager struct {
	secret []byte
	ttl    time.Duration
}

type claims struct {
	FirebaseUID string `json:"firebaseUid"`
	Email       string `json:"email"`
	AdminUserID uint   `json:"adminUserId"`
	jwt.RegisteredClaims
}

func New(secret string, ttl time.Duration) (*Manager, error) {
	if secret == "" {
		return nil, fmt.Errorf("SESSION_JWT_SECRET is required")
	}
	if ttl <= 0 {
		ttl = 12 * time.Hour
	}

	return &Manager{
		secret: []byte(secret),
		ttl:    ttl,
	}, nil
}

func (m *Manager) Issue(ctx context.Context, sessionClaims auth.SessionClaims) (string, error) {
	_ = ctx

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
		FirebaseUID: sessionClaims.FirebaseUID,
		Email:       sessionClaims.Email,
		AdminUserID: sessionClaims.AdminUserID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   sessionClaims.FirebaseUID,
			IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
			ExpiresAt: jwt.NewNumericDate(time.Now().UTC().Add(m.ttl)),
			Issuer:    "fukunishifarm",
			Audience:  jwt.ClaimStrings{"admin"},
		},
	})

	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", fmt.Errorf("sign session token: %w", err)
	}

	return signed, nil
}

func (m *Manager) Verify(ctx context.Context, tokenString string) (auth.SessionClaims, error) {
	_ = ctx

	parsed, err := jwt.ParseWithClaims(tokenString, &claims{}, func(token *jwt.Token) (any, error) {
		alg := "unknown"
		if token.Method != nil {
			alg = token.Method.Alg()
		}
		if alg != jwt.SigningMethodHS256.Alg() {
			return nil, fmt.Errorf("unexpected signing method: %s", alg)
		}
		return m.secret, nil
	})
	if err != nil {
		return auth.SessionClaims{}, fmt.Errorf("parse session token: %w", err)
	}

	sessionClaims, ok := parsed.Claims.(*claims)
	if !ok || !parsed.Valid {
		return auth.SessionClaims{}, fmt.Errorf("invalid session token")
	}

	return auth.SessionClaims{
		FirebaseUID: sessionClaims.FirebaseUID,
		Email:       sessionClaims.Email,
		AdminUserID: sessionClaims.AdminUserID,
	}, nil
}
