package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username	string		`gorm:"not null" json:"username"`
	Password	string		`gorm:"not null" json:"-"`
	Role		string		`gorm:"not null;default:'pasien'" json:"role"`
	CreatedAt	time.Time	`json:"created_at"`
}
