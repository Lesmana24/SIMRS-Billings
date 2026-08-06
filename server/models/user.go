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
	FullName     string    `gorm:"type:varchar(255)" json:"full_name"`
	Email        string    `gorm:"type:varchar(255)" json:"email"`
	Phone        string    `gorm:"type:varchar(50)" json:"phone"`
	Address      string    `gorm:"type:text" json:"address"`
	NIK          string    `gorm:"type:varchar(30)" json:"nik"`
	TwoFactorPIN string    `gorm:"type:varchar(6);default:'123456'" json:"two_factor_pin"`
	CreatedAt    time.Time `json:"created_at"`
}
