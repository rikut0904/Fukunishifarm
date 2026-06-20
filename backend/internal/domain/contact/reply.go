package contact

import "time"

type Reply struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	MessageID    uint      `gorm:"not null;index" json:"messageId"`
	SenderType   string    `gorm:"size:32;not null" json:"senderType"`
	SenderUserID uint      `gorm:"not null" json:"senderUserId"`
	SenderName   string    `gorm:"size:255;not null" json:"senderName"`
	SenderEmail  string    `gorm:"size:320;not null" json:"senderEmail"`
	Message      string    `gorm:"type:text;not null" json:"message"`
	CreatedAt    time.Time `json:"createdAt"`
}

func (Reply) TableName() string {
	return "contact_replies"
}
