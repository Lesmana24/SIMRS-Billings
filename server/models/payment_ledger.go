package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type PaymentLedger struct {
	gorm.Model
	BillingID	uint	`gorm:"not null" json:"billing_id"`
	EntryType	string	`gorm:"not null" json:"entry_type"`
	Amount		decimal.Decimal	`gorm:"type:numeric(15,2);not null" json:"amount"`
	Description string          `gorm:"not null" json:"description"`
	CreatedAt   time.Time       `json:"created_at"`
}