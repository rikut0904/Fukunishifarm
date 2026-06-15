package news

import "time"

type Item struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Date      string    `gorm:"size:32;not null" json:"date"`
	Title     string    `gorm:"size:160;not null" json:"title"`
	Body      string    `gorm:"type:text;not null" json:"body"`
	SortOrder int       `gorm:"not null;default:0" json:"sortOrder"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (Item) TableName() string {
	return "news_items"
}

type Catalog struct {
	Items []Item `json:"items"`
}
