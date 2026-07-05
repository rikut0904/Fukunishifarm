package grape

import "time"

type SaleStatus string

const (
	SaleStatusPreparing SaleStatus = "preparing"
	SaleStatusOnSale    SaleStatus = "on_sale"
	SaleStatusEnded     SaleStatus = "ended"
)

type Item struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Name        string     `gorm:"size:120;not null" json:"name"`
	Description string     `gorm:"type:text;not null" json:"description"`
	SaleStatus  SaleStatus `gorm:"size:20;not null;default:'preparing'" json:"saleStatus"`
	ImagePath   string     `gorm:"size:255;not null" json:"imagePath"`
	ImageFocus  string     `gorm:"size:120;not null" json:"imageFocus"`
	ImageScale  int        `gorm:"not null;default:100" json:"imageScale"`
	SortOrder   int        `gorm:"not null;default:0" json:"sortOrder"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

func (Item) TableName() string {
	return "grape_items"
}

func (s SaleStatus) IsValid() bool {
	return s == SaleStatusPreparing || s == SaleStatusOnSale || s == SaleStatusEnded
}

type Catalog struct {
	Items []Item
}
