package httpapi

import (
	"context"
	"errors"
	"strings"
	"time"

	domainauth "fukunishifarm/backend/internal/domain/auth"
	domaincontact "fukunishifarm/backend/internal/domain/contact"
	domaingrape "fukunishifarm/backend/internal/domain/grape"
	domainnews "fukunishifarm/backend/internal/domain/news"
	usecaseauth "fukunishifarm/backend/internal/usecase/auth"
	usecasecontact "fukunishifarm/backend/internal/usecase/contact"
	usecasegrape "fukunishifarm/backend/internal/usecase/grape"
	usecasenews "fukunishifarm/backend/internal/usecase/news"
	huma "github.com/danielgtaylor/huma/v2"
)

const contactReplySenderName = "ふくにしファーム"

type healthOutput struct {
	Body struct {
		Status   string `json:"status" example:"ok"`
		Service  string `json:"service" example:"fukunishi-farm-api"`
		Migrated bool   `json:"migrated"`
	}
}

type sessionInput struct {
	Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
}

type loginInput struct {
	Body struct {
		Email    string `json:"email" required:"true" example:"admin@example.com"`
		Password string `json:"password" required:"true" example:"password"`
	}
}

type createUserInput struct {
	Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
	Body          struct {
		Email       string `json:"email" required:"true" example:"new-user@example.com"`
		Password    string `json:"password" required:"true" example:"password"`
		DisplayName string `json:"displayName,omitempty" example:"新規ユーザー"`
	}
}

type adminUserResponse struct {
	ID          uint      `json:"id"`
	FirebaseUID string    `json:"firebaseUid"`
	Email       string    `json:"email"`
	DisplayName string    `json:"displayName,omitempty"`
	PhotoURL    string    `json:"photoURL,omitempty"`
	Role        string    `json:"role"`
	LastLoginAt time.Time `json:"lastLoginAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type sessionOutput struct {
	Body struct {
		User adminUserResponse `json:"user"`
	}
}

type loginOutput struct {
	Body struct {
		Token string            `json:"token"`
		User  adminUserResponse `json:"user"`
	}
}

type createUserOutput struct {
	Body struct {
		User adminUserResponse `json:"user"`
	}
}

type contactMessagePayload struct {
	Name     string `json:"name" required:"true" maxLength:"80"`
	Email    string `json:"email" required:"true" maxLength:"320"`
	Category string `json:"category" required:"true" maxLength:"64"`
	Subject  string `json:"subject" required:"true" maxLength:"160"`
	Message  string `json:"message" required:"true" maxLength:"65535"`
}

type contactMessageInput struct {
	Body contactMessagePayload
}

type contactMessageResponse struct {
	ID        uint      `json:"id"`
	ThreadID  string    `json:"threadId"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Category  string    `json:"category"`
	Subject   string    `json:"subject"`
	Message   string    `json:"message"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type contactReplyResponse struct {
	ID          uint      `json:"id"`
	MessageID   uint      `json:"messageId"`
	ThreadID    string    `json:"threadId"`
	SenderType  string    `json:"senderType"`
	SenderName  string    `json:"senderName"`
	SenderEmail string    `json:"senderEmail"`
	Message     string    `json:"message"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

type contactMessageOutput struct {
	Body struct {
		Message contactMessageResponse `json:"message"`
	}
}

type contactMessageDetailResponse struct {
	Body struct {
		Message contactMessageResponse `json:"message"`
		Replies []contactReplyResponse `json:"replies"`
	}
}

type adminContactListInput struct {
	Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
	Status        string `query:"status" doc:"Filter by status (pending, in_progress, resolved, unresolved, all)"`
	Page          int    `query:"page" doc:"Page number (1-based)"`
	Limit         int    `query:"limit" doc:"Number of items per page" minimum:"1" maximum:"100" default:"25"`
}

type contactMessageCatalogResponse struct {
	Body struct {
		Messages []contactMessageResponse `json:"messages"`
		Total    int64                    `json:"total"`
		Page     int                      `json:"page"`
		Limit    int                      `json:"limit"`
	}
}

type contactThreadInput struct {
	ThreadID string `path:"threadId"`
}

type contactThreadReplyInput struct {
	ThreadID string `path:"threadId"`
	Body     struct {
		Message string `json:"message" required:"true" maxLength:"65535"`
	}
}

type contactThreadReplyOutput struct {
	Body struct {
		Reply contactReplyResponse `json:"reply"`
	}
}

type contactReplyInput struct {
	Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
	ID            uint   `path:"id"`
	Body          struct {
		Message string `json:"message" required:"true" maxLength:"65535"`
	}
}

type contactReplyOutput struct {
	Body struct {
		Reply contactReplyResponse `json:"reply"`
	}
}

type contactStatusInput struct {
	Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
	ID            uint   `path:"id"`
	Body          struct {
		Status string `json:"status" required:"true" example:"in_progress"`
	}
}

type contactStatusOutput struct {
	Body struct {
		Success bool `json:"success"`
	}
}

type grapeItemResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsOnSale    bool      `json:"isOnSale"`
	ImagePath   string    `json:"imagePath"`
	ImageFocus  string    `json:"imageFocus"`
	ImageScale  int       `json:"imageScale"`
	SortOrder   int       `json:"sortOrder"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type grapeCatalogResponse struct {
	Body struct {
		Items []grapeItemResponse `json:"items"`
	}
}

type grapeItemInput struct {
	Name        string `json:"name" required:"true"`
	Description string `json:"description" required:"true"`
	IsOnSale    bool   `json:"isOnSale"`
	ImagePath   string `json:"imagePath" required:"true"`
	ImageFocus  string `json:"imageFocus" required:"true"`
	ImageScale  int    `json:"imageScale"`
	SortOrder   int    `json:"sortOrder"`
}

type grapeCatalogInput struct {
	Body struct {
		Items []grapeItemInput `json:"items"`
	}
}

type newsItemResponse struct {
	ID        uint      `json:"id"`
	Date      string    `json:"date"`
	Title     string    `json:"title"`
	SortOrder int       `json:"sortOrder"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type newsCatalogResponse struct {
	Body struct {
		Items []newsItemResponse `json:"items"`
	}
}

type newsItemOutput struct {
	Body struct {
		Item newsItemResponse `json:"item"`
	}
}

type newsItemInput struct {
	Date      string `json:"date" required:"true"`
	Title     string `json:"title" required:"true"`
	SortOrder int    `json:"sortOrder"`
}

type newsCatalogInput struct {
	Body struct {
		Items []newsItemInput `json:"items"`
	}
}

type newsItemOrderInput struct {
	ID        uint `json:"id" required:"true"`
	SortOrder int  `json:"sortOrder"`
}

type newsOrderInput struct {
	Body struct {
		Items []newsItemOrderInput `json:"items"`
	}
}

type grapeItemPath struct {
	ID uint `path:"id"`
}

type grapeItemOutput struct {
	Body struct {
		Item grapeItemResponse `json:"item"`
	}
}

func Register(api huma.API, authService *usecaseauth.Service, grapeService *usecasegrape.Service, newsService *usecasenews.Service, contactService *usecasecontact.Service, migrated bool) {
	huma.Get(api, "/healthz", func(ctx context.Context, input *struct{}) (*healthOutput, error) {
		output := &healthOutput{}
		output.Body.Status = "ok"
		output.Body.Service = "fukunishi-farm-api"
		output.Body.Migrated = migrated
		return output, nil
	})

	huma.Post(api, "/v1/admin/users", func(ctx context.Context, input *createUserInput) (*createUserOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		user, err := authService.CreateUser(ctx, token, input.Body.Email, input.Body.Password, input.Body.DisplayName)
		if err != nil {
			return nil, mapAuthError("failed to create firebase user", err)
		}

		output := &createUserOutput{}
		output.Body.User = toAdminUserResponse(user)
		return output, nil
	})

	huma.Post(api, "/v1/auth/login", func(ctx context.Context, input *loginInput) (*loginOutput, error) {
		session, err := authService.LoginAdmin(ctx, input.Body.Email, input.Body.Password)
		if err != nil {
			return nil, mapAuthError("failed to login", err)
		}

		output := &loginOutput{}
		output.Body.Token = session.Token
		output.Body.User = toAdminUserResponse(session.User)
		return output, nil
	})

	huma.Get(api, "/v1/auth/session", func(ctx context.Context, input *sessionInput) (*sessionOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		user, err := authService.GetSession(ctx, token)
		if err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		output := &sessionOutput{}
		output.Body.User = toAdminUserResponse(user)
		return output, nil
	})

	huma.Get(api, "/v1/grapes", func(ctx context.Context, input *struct{}) (*grapeCatalogResponse, error) {
		catalog, err := grapeService.GetPublicCatalog(ctx)
		if err != nil {
			return nil, mapGrapeError("failed to load grape catalog", err)
		}

		return toGrapeCatalogResponse(catalog), nil
	})

	huma.Get(api, "/v1/admin/grapes", func(ctx context.Context, input *sessionInput) (*grapeCatalogResponse, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		catalog, err := grapeService.GetAdminCatalog(ctx)
		if err != nil {
			return nil, mapGrapeError("failed to load grape catalog", err)
		}

		return toGrapeCatalogResponse(catalog), nil
	})

	huma.Post(api, "/v1/admin/grapes", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		Body          grapeItemInput
	}) (*grapeItemOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		saved, err := grapeService.SaveItem(ctx, toGrapeItem(input.Body))
		if err != nil {
			return nil, mapGrapeError("failed to create grape item", err)
		}

		output := &grapeItemOutput{}
		output.Body.Item = toGrapeItemResponse(saved)
		return output, nil
	})

	huma.Put(api, "/v1/admin/grapes/{id}", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		ID            uint   `path:"id"`
		Body          grapeItemInput
	}) (*grapeItemOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		saved, err := grapeService.SaveItem(ctx, toGrapeItemWithID(input.ID, input.Body))
		if err != nil {
			return nil, mapGrapeError("failed to update grape item", err)
		}

		output := &grapeItemOutput{}
		output.Body.Item = toGrapeItemResponse(saved)
		return output, nil
	})

	huma.Delete(api, "/v1/admin/grapes/{id}", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		ID            uint   `path:"id"`
	}) (*struct{}, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		if err := grapeService.DeleteItem(ctx, input.ID); err != nil {
			return nil, mapGrapeError("failed to delete grape item", err)
		}

		return &struct{}{}, nil
	})

	huma.Put(api, "/v1/admin/grapes", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		Body          grapeCatalogInput
	}) (*grapeCatalogResponse, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		catalog, err := grapeService.ReplaceCatalog(ctx, toGrapeCatalog(input.Body))
		if err != nil {
			return nil, mapGrapeError("failed to update grape catalog", err)
		}

		return toGrapeCatalogResponse(catalog), nil
	})

	huma.Get(api, "/v1/news", func(ctx context.Context, input *struct{}) (*newsCatalogResponse, error) {
		catalog, err := newsService.GetPublicCatalog(ctx)
		if err != nil {
			return nil, mapNewsError("failed to load news catalog", err)
		}

		return toNewsCatalogResponse(catalog), nil
	})

	huma.Post(api, "/v1/contact", func(ctx context.Context, input *contactMessageInput) (*contactMessageOutput, error) {
		saved, err := contactService.SubmitMessage(ctx, toContactMessage(input.Body))
		if err != nil {
			return nil, mapContactError("failed to submit contact message", err)
		}

		output := &contactMessageOutput{}
		output.Body.Message = toContactMessageResponse(saved)
		return output, nil
	})

	huma.Get(api, "/v1/contact/{threadId}", func(ctx context.Context, input *contactThreadInput) (*contactMessageDetailResponse, error) {
		detail, err := contactService.GetMessageDetailByThreadID(ctx, input.ThreadID)
		if err != nil {
			return nil, mapContactError("failed to load contact thread", err)
		}

		output := &contactMessageDetailResponse{}
		output.Body.Message = toContactMessageResponse(detail.Message)
		output.Body.Replies = make([]contactReplyResponse, 0, len(detail.Replies))
		for _, reply := range detail.Replies {
			output.Body.Replies = append(output.Body.Replies, toContactReplyResponse(reply))
		}
		return output, nil
	})

	huma.Get(api, "/v1/admin/contact", func(ctx context.Context, input *adminContactListInput) (*contactMessageCatalogResponse, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		if input.Page < 1 {
			input.Page = 1
		}
		if input.Limit <= 0 {
			input.Limit = 25
		}

		messages, total, err := contactService.ListMessages(ctx, input.Status, input.Page, input.Limit)
		if err != nil {
			return nil, mapContactError("failed to load contact messages", err)
		}

		output := &contactMessageCatalogResponse{}
		output.Body.Messages = make([]contactMessageResponse, 0, len(messages))
		for _, message := range messages {
			output.Body.Messages = append(output.Body.Messages, toContactMessageResponse(message))
		}
		output.Body.Total = total
		output.Body.Page = input.Page
		output.Body.Limit = input.Limit
		return output, nil
	})

	huma.Get(api, "/v1/admin/contact/{id}", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		ID            uint   `path:"id"`
	}) (*contactMessageDetailResponse, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		detail, err := contactService.GetMessageDetail(ctx, input.ID)
		if err != nil {
			return nil, mapContactError("failed to load contact message", err)
		}

		output := &contactMessageDetailResponse{}
		output.Body.Message = toContactMessageResponse(detail.Message)
		output.Body.Replies = make([]contactReplyResponse, 0, len(detail.Replies))
		for _, reply := range detail.Replies {
			output.Body.Replies = append(output.Body.Replies, toContactReplyResponse(reply))
		}
		return output, nil
	})

	huma.Post(api, "/v1/admin/contact/{id}/replies", func(ctx context.Context, input *contactReplyInput) (*contactReplyOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		user, err := authService.GetSession(ctx, token)
		if err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		reply, err := contactService.ReplyMessage(ctx, input.ID, usecasecontact.ReplyAuthor{
			UserID: user.ID,
			Name:   contactReplySenderName,
			Email:  user.Email,
		}, input.Body.Message)
		if err != nil {
			return nil, mapContactError("failed to create contact reply", err)
		}

		output := &contactReplyOutput{}
		output.Body.Reply = toContactReplyResponse(reply)
		return output, nil
	})

	huma.Put(api, "/v1/admin/contact/{id}/status", func(ctx context.Context, input *contactStatusInput) (*contactStatusOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		err := contactService.UpdateStatus(ctx, input.ID, input.Body.Status)
		if err != nil {
			return nil, mapContactError("failed to update contact status", err)
		}

		output := &contactStatusOutput{}
		output.Body.Success = true
		return output, nil
	})

	huma.Post(api, "/v1/contact/{threadId}/replies", func(ctx context.Context, input *contactThreadReplyInput) (*contactThreadReplyOutput, error) {
		reply, err := contactService.ReplyThread(ctx, input.ThreadID, input.Body.Message)
		if err != nil {
			return nil, mapContactError("failed to create contact reply", err)
		}

		output := &contactThreadReplyOutput{}
		output.Body.Reply = toContactReplyResponse(reply)
		return output, nil
	})

	huma.Get(api, "/v1/admin/news", func(ctx context.Context, input *sessionInput) (*newsCatalogResponse, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		catalog, err := newsService.GetAdminCatalog(ctx)
		if err != nil {
			return nil, mapNewsError("failed to load news catalog", err)
		}

		return toNewsCatalogResponse(catalog), nil
	})

	huma.Post(api, "/v1/admin/news", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		Body          newsItemInput
	}) (*newsItemOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		saved, err := newsService.CreateItem(ctx, toNewsItem(input.Body))
		if err != nil {
			return nil, mapNewsError("failed to create news item", err)
		}

		output := &newsItemOutput{}
		output.Body.Item = toNewsItemResponse(saved)
		return output, nil
	})

	huma.Put(api, "/v1/admin/news/{id}", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		ID            uint   `path:"id"`
		Body          newsItemInput
	}) (*newsItemOutput, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		saved, err := newsService.UpdateItem(ctx, toNewsItemWithID(input.ID, input.Body))
		if err != nil {
			return nil, mapNewsError("failed to update news item", err)
		}

		output := &newsItemOutput{}
		output.Body.Item = toNewsItemResponse(saved)
		return output, nil
	})

	huma.Put(api, "/v1/admin/news/reorder", func(ctx context.Context, input *newsOrderInput) (*newsCatalogResponse, error) {
		catalog, err := newsService.ReorderCatalog(ctx, toNewsOrderCatalog(input.Body))
		if err != nil {
			return nil, mapNewsError("failed to reorder news items", err)
		}

		return toNewsCatalogResponse(catalog), nil
	})

	huma.Delete(api, "/v1/admin/news/{id}", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		ID            uint   `path:"id"`
	}) (*struct{}, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		if err := newsService.DeleteItem(ctx, input.ID); err != nil {
			return nil, mapNewsError("failed to delete news item", err)
		}

		return &struct{}{}, nil
	})

	huma.Put(api, "/v1/admin/news", func(ctx context.Context, input *struct {
		Authorization string `header:"Authorization" required:"true" doc:"Backend session token with Bearer prefix"`
		Body          newsCatalogInput
	}) (*newsCatalogResponse, error) {
		token := bearerToken(input.Authorization)
		if token == "" {
			return nil, huma.Error400BadRequest("missing bearer token")
		}

		if _, err := authService.GetSession(ctx, token); err != nil {
			return nil, mapAuthError("failed to load admin session", err)
		}

		catalog, err := newsService.ReplaceCatalog(ctx, toNewsCatalog(input.Body))
		if err != nil {
			return nil, mapNewsError("failed to update news catalog", err)
		}

		return toNewsCatalogResponse(catalog), nil
	})
}

func mapAuthError(message string, err error) error {
	switch {
	case errors.Is(err, usecaseauth.ErrInvalidInput):
		return huma.Error400BadRequest("invalid input", err)
	case errors.Is(err, domainauth.ErrInvalidInput):
		return huma.Error400BadRequest("invalid input", err)
	case errors.Is(err, usecaseauth.ErrUnauthorized):
		return huma.Error401Unauthorized("unauthorized")
	case errors.Is(err, usecaseauth.ErrForbidden):
		return huma.Error403Forbidden("forbidden")
	case errors.Is(err, domainauth.ErrUserNotFound):
		return huma.Error401Unauthorized("unauthorized")
	default:
		return huma.Error500InternalServerError(message, err)
	}
}

func mapGrapeError(message string, err error) error {
	switch {
	case errors.Is(err, domaingrape.ErrInvalidInput):
		return huma.Error400BadRequest("invalid input", err)
	case errors.Is(err, domaingrape.ErrItemNotFound):
		return huma.Error404NotFound("not found", err)
	default:
		return huma.Error500InternalServerError(message, err)
	}
}

func mapNewsError(message string, err error) error {
	switch {
	case errors.Is(err, domainnews.ErrInvalidInput):
		return huma.Error400BadRequest("invalid input", err)
	case errors.Is(err, domainnews.ErrItemNotFound):
		return huma.Error404NotFound("not found", err)
	default:
		return huma.Error500InternalServerError(message, err)
	}
}

func mapContactError(message string, err error) error {
	switch {
	case errors.Is(err, domaincontact.ErrInvalidInput):
		return huma.Error400BadRequest("invalid input", err)
	case errors.Is(err, domaincontact.ErrMessageNotFound):
		return huma.Error404NotFound("not found", err)
	case errors.Is(err, domaincontact.ErrMailNotConfigured):
		return huma.Error500InternalServerError("mail configuration is missing", err)
	default:
		return huma.Error500InternalServerError(message, err)
	}
}

func bearerToken(header string) string {
	value := strings.TrimSpace(header)
	if value == "" {
		return ""
	}

	parts := strings.Fields(value)
	if len(parts) != 2 {
		return ""
	}

	if !strings.EqualFold(parts[0], "bearer") {
		return ""
	}

	return strings.TrimSpace(parts[1])
}

func toAdminUserResponse(user *domainauth.AdminUser) adminUserResponse {
	return adminUserResponse{
		ID:          user.ID,
		FirebaseUID: user.FirebaseUID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		PhotoURL:    user.PhotoURL,
		Role:        user.Role,
		LastLoginAt: user.LastLoginAt,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}
}

func toGrapeCatalog(input grapeCatalogInput) domaingrape.Catalog {
	items := make([]domaingrape.Item, 0, len(input.Body.Items))
	for _, item := range input.Body.Items {
		items = append(items, domaingrape.Item{
			Name:        item.Name,
			Description: item.Description,
			IsOnSale:    item.IsOnSale,
			ImagePath:   item.ImagePath,
			ImageFocus:  item.ImageFocus,
			ImageScale:  item.ImageScale,
			SortOrder:   item.SortOrder,
		})
	}

	return domaingrape.Catalog{Items: items}
}

func toGrapeItem(input grapeItemInput) domaingrape.Item {
	return domaingrape.Item{
		Name:        input.Name,
		Description: input.Description,
		IsOnSale:    input.IsOnSale,
		ImagePath:   input.ImagePath,
		ImageFocus:  input.ImageFocus,
		ImageScale:  input.ImageScale,
		SortOrder:   input.SortOrder,
	}
}

func toGrapeItemWithID(id uint, input grapeItemInput) domaingrape.Item {
	item := toGrapeItem(input)
	item.ID = id
	return item
}

func toGrapeCatalogResponse(catalog domaingrape.Catalog) *grapeCatalogResponse {
	output := &grapeCatalogResponse{}
	output.Body.Items = make([]grapeItemResponse, 0, len(catalog.Items))
	for _, item := range catalog.Items {
		output.Body.Items = append(output.Body.Items, toGrapeItemResponse(item))
	}

	return output
}

func toGrapeItemResponse(item domaingrape.Item) grapeItemResponse {
	return grapeItemResponse{
		ID:          item.ID,
		Name:        item.Name,
		Description: item.Description,
		IsOnSale:    item.IsOnSale,
		ImagePath:   item.ImagePath,
		ImageFocus:  item.ImageFocus,
		ImageScale:  item.ImageScale,
		SortOrder:   item.SortOrder,
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}
}

func toNewsCatalog(input newsCatalogInput) domainnews.Catalog {
	items := make([]domainnews.Item, 0, len(input.Body.Items))
	for _, item := range input.Body.Items {
		items = append(items, domainnews.Item{
			Date:      item.Date,
			Title:     item.Title,
			SortOrder: item.SortOrder,
		})
	}

	return domainnews.Catalog{Items: items}
}

func toNewsItem(input newsItemInput) domainnews.Item {
	return domainnews.Item{
		Date:      input.Date,
		Title:     input.Title,
		SortOrder: input.SortOrder,
	}
}

func toNewsItemWithID(id uint, input newsItemInput) domainnews.Item {
	item := toNewsItem(input)
	item.ID = id
	return item
}

func toNewsOrderCatalog(input struct {
	Items []newsItemOrderInput `json:"items"`
}) domainnews.Catalog {
	items := make([]domainnews.Item, 0, len(input.Items))
	for _, item := range input.Items {
		items = append(items, domainnews.Item{
			ID:        item.ID,
			SortOrder: item.SortOrder,
		})
	}

	return domainnews.Catalog{Items: items}
}

func toContactMessage(input contactMessagePayload) domaincontact.Message {
	return domaincontact.Message{
		Name:     input.Name,
		Email:    input.Email,
		Category: input.Category,
		Subject:  input.Subject,
		Body:     input.Message,
	}
}

func toContactMessageResponse(message domaincontact.Message) contactMessageResponse {
	return contactMessageResponse{
		ID:        message.ID,
		ThreadID:  message.ThreadID,
		Name:      message.Name,
		Email:     message.Email,
		Category:  message.Category,
		Subject:   message.Subject,
		Message:   message.Body,
		Status:    message.Status,
		CreatedAt: message.CreatedAt,
	}
}

func toContactReplyResponse(reply domaincontact.Reply) contactReplyResponse {
	return contactReplyResponse{
		ID:          reply.ID,
		MessageID:   reply.MessageID,
		ThreadID:    reply.ThreadID,
		SenderType:  reply.SenderType,
		SenderName:  reply.SenderName,
		SenderEmail: reply.SenderEmail,
		Message:     reply.Message,
		Status:      reply.Status,
		CreatedAt:   reply.CreatedAt,
	}
}

func toNewsItemResponse(item domainnews.Item) newsItemResponse {
	return newsItemResponse{
		ID:        item.ID,
		Date:      item.Date,
		Title:     item.Title,
		SortOrder: item.SortOrder,
		CreatedAt: item.CreatedAt,
		UpdatedAt: item.UpdatedAt,
	}
}

func toNewsCatalogResponse(catalog domainnews.Catalog) *newsCatalogResponse {
	output := &newsCatalogResponse{}
	output.Body.Items = make([]newsItemResponse, 0, len(catalog.Items))
	for _, item := range catalog.Items {
		output.Body.Items = append(output.Body.Items, newsItemResponse{
			ID:        item.ID,
			Date:      item.Date,
			Title:     item.Title,
			SortOrder: item.SortOrder,
			CreatedAt: item.CreatedAt,
			UpdatedAt: item.UpdatedAt,
		})
	}

	return output
}
