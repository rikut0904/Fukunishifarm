package auth

import "time"

type AdminUser struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	FirebaseUID string    `gorm:"size:255;uniqueIndex;not null" json:"firebaseUid"`
	Email       string    `gorm:"size:320;uniqueIndex;not null" json:"email"`
	DisplayName string    `gorm:"size:255" json:"displayName,omitempty"`
	PhotoURL    string    `gorm:"type:text" json:"photoURL,omitempty"`
	Role        string    `gorm:"size:50;not null;default:admin" json:"role"`
	LastLoginAt time.Time `gorm:"not null" json:"lastLoginAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type VerifiedIdentity struct {
	FirebaseUID string
	Email       string
	DisplayName string
	PhotoURL    string
}
