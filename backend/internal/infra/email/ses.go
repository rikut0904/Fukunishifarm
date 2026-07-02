package email

import (
	"context"
	"fmt"
	"net/mail"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awscfg "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sesv2/types"
)

const defaultFromName = "ふくにしファーム"

type SESReplySender struct {
	client    *sesv2.Client
	fromEmail string
	fromName  string
}

func NewSESReplySender(ctx context.Context, region, accessKeyID, secretAccessKey, sessionToken, fromEmail string) (*SESReplySender, error) {
	region = strings.TrimSpace(region)
	accessKeyID = strings.TrimSpace(accessKeyID)
	secretAccessKey = strings.TrimSpace(secretAccessKey)
	sessionToken = strings.TrimSpace(sessionToken)
	fromEmail = strings.TrimSpace(fromEmail)
	if region == "" {
		return nil, fmt.Errorf("AWS_REGION is required")
	}
	if fromEmail == "" {
		return nil, fmt.Errorf("SES_FROM_EMAIL is required")
	}

	loadOptions := []func(*awscfg.LoadOptions) error{awscfg.WithRegion(region)}
	if accessKeyID != "" && secretAccessKey != "" {
		loadOptions = append(loadOptions, awscfg.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, sessionToken)))
	} else if accessKeyID != "" || secretAccessKey != "" {
		return nil, fmt.Errorf("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be provided together")
	}

	cfg, err := awscfg.LoadDefaultConfig(ctx, loadOptions...)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}

	return &SESReplySender{
		client:    sesv2.NewFromConfig(cfg),
		fromEmail: fromEmail,
		fromName:  defaultFromName,
	}, nil
}

func (s *SESReplySender) SendReplyEmail(ctx context.Context, toEmail, subject, body string) error {
	if strings.TrimSpace(subject) == "" {
		subject = "【ふくにしファーム】お問い合わせへのご返信"
	}
	return s.sendEmail(ctx, toEmail, subject, body)
}

func (s *SESReplySender) SendInvitationEmail(ctx context.Context, toEmail, subject, body string) error {
	if strings.TrimSpace(subject) == "" {
		subject = "【ふくにしファーム】管理画面への招待"
	}
	return s.sendEmail(ctx, toEmail, subject, body)
}

func (s *SESReplySender) sendEmail(ctx context.Context, toEmail, subject, body string) error {
	if s == nil || s.client == nil {
		return fmt.Errorf("ses sender is not initialized")
	}

	toEmail = strings.TrimSpace(toEmail)
	subject = strings.TrimSpace(subject)
	body = strings.TrimSpace(body)
	if toEmail == "" {
		return fmt.Errorf("recipient email is required")
	}
	if body == "" {
		return fmt.Errorf("email body is required")
	}

	_, err := s.client.SendEmail(ctx, &sesv2.SendEmailInput{
		FromEmailAddress: aws.String(formatFromAddress(s.fromName, s.fromEmail)),
		Destination: &types.Destination{
			ToAddresses: []string{toEmail},
		},
		Content: &types.EmailContent{
			Simple: &types.Message{
				Subject: &types.Content{
					Data:    aws.String(subject),
					Charset: aws.String("UTF-8"),
				},
				Body: &types.Body{
					Text: &types.Content{
						Data:    aws.String(body),
						Charset: aws.String("UTF-8"),
					},
				},
			},
		},
	})
	if err != nil {
		return fmt.Errorf("send ses email: %w", err)
	}

	return nil
}

func formatFromAddress(name, email string) string {
	name = strings.TrimSpace(name)
	email = strings.TrimSpace(email)
	if email == "" {
		return ""
	}
	if name == "" {
		return email
	}

	return (&mail.Address{Name: name, Address: email}).String()
}
