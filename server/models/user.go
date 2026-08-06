package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username     string    `gorm:"not null" json:"username"`
	Password     string    `gorm:"not null" json:"-"`
	Role         string    `gorm:"not null;default:'pasien'" json:"role"`
	TwoFactorPIN string    `gorm:"type:varchar(6);default:'123456'" json:"two_factor_pin"`
	CreatedAt    time.Time `json:"created_at"`
}
