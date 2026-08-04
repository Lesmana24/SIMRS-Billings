package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type Tarif struct {
	gorm.Model
	ActionName	string			`gorm:"not null" json:"action_name"`
	Amount		decimal.Decimal	`gorm:"type:decimal(15,2);not null" json:"amount"`
	CreatedAt	time.Time		`json:"created_at"`
}