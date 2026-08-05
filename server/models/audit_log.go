package models

import (
	"time"

	"gorm.io/gorm"
)

type AuditLog struct {
	gorm.Model
	UserID    uint      `gorm:"not null" json:"user_id"`
	Username  string    `gorm:"type:varchar(100);not null" json:"username"`
	Role      string    `gorm:"type:varchar(50);not null" json:"role"`
	Action    string    `gorm:"type:varchar(100);not null" json:"action"`
	Resource  string    `gorm:"type:varchar(255);not null" json:"resource"`
	Details   string    `gorm:"type:text" json:"details"`
	IPAddress string    `gorm:"type:varchar(50)" json:"ip_address"`
	CreatedAt time.Time `json:"created_at"`
}
