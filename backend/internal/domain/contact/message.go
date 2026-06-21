package contact

import "time"

type Message struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ThreadID  string    `gorm:"size:36;uniqueIndex" json:"threadId"`
	Name      string    `gorm:"size:80;not null" json:"name"`
	Email     string    `gorm:"size:320;not null" json:"email"`
	Category  string    `gorm:"size:64;not null" json:"category"`
	Subject   string    `gorm:"size:160;not null" json:"subject"`
	Body      string    `gorm:"type:text;not null" json:"body"`
	Status    string    `gorm:"size:32;not null;default:'pending'" json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (Message) TableName() string {
	return "contact_messages"
}
