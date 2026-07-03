package grape

import "time"

type Item struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:120;not null" json:"name"`
	Description string    `gorm:"type:text;not null" json:"description"`
	IsOnSale    bool      `gorm:"not null" json:"isOnSale"`
	ImagePath   string    `gorm:"size:255;not null" json:"imagePath"`
	ImageFocus  string    `gorm:"size:120;not null" json:"imageFocus"`
	ImageScale  int       `gorm:"not null;default:100" json:"imageScale"`
	SortOrder   int       `gorm:"not null;default:0" json:"sortOrder"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (Item) TableName() string {
	return "grape_items"
}

type Catalog struct {
	Items []Item
}
