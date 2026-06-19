package contact

import (
	"context"
	"fmt"
	"net/mail"
	"strings"

	domaincontact "fukunishifarm/backend/internal/domain/contact"
)

type Service struct {
	repository domaincontact.Repository
}

func NewService(repository domaincontact.Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) SubmitMessage(ctx context.Context, message domaincontact.Message) (domaincontact.Message, error) {
	normalized, err := normalizeMessage(message)
	if err != nil {
		return domaincontact.Message{}, err
	}

	saved, err := s.repository.CreateMessage(ctx, normalized)
	if err != nil {
		return domaincontact.Message{}, fmt.Errorf("create contact message: %w", err)
	}

	return saved, nil
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

	if message.Name == "" || message.Email == "" || message.Subject == "" || message.Body == "" {
		return domaincontact.Message{}, domaincontact.ErrInvalidInput
	}

	if _, err := mail.ParseAddress(message.Email); err != nil {
		return domaincontact.Message{}, domaincontact.ErrInvalidInput
	}

	return message, nil
}
