package grape

import "context"

type Repository interface {
	ListItems(ctx context.Context) ([]Item, error)
	ReplaceItems(ctx context.Context, items []Item) error
	CreateItem(ctx context.Context, item Item) (Item, error)
	UpdateItem(ctx context.Context, item Item) (Item, error)
	DeleteItem(ctx context.Context, id uint) error
}
