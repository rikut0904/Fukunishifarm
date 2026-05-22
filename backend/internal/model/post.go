package model

import "time"

type Post struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	Slug          string     `gorm:"size:200;uniqueIndex;not null" json:"slug"`
	Title         string     `gorm:"size:200;not null" json:"title"`
	Excerpt       string     `gorm:"type:text;not null" json:"excerpt"`
	Body          string     `gorm:"type:text;not null" json:"body"`
	CoverImageURL string     `gorm:"type:text" json:"coverImageUrl,omitempty"`
	Published     bool       `gorm:"not null;default:false" json:"published"`
	PublishedAt   *time.Time `json:"publishedAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}
