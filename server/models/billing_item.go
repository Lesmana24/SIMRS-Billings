package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type BillingItem struct {
	gorm.Model
	BillingID 		uint			`gorm:"not null"`
	ItemName		string			`gorm:"not null" json:"item_name"`
	UnitPrice		decimal.Decimal	`gorm:"type:decimal(15,2);not null" json:"unit_price"`
	Quantity		int				`gorm:"not null" json:"quantity"`
	SubTotal		decimal.Decimal	`gorm:"type:decimal(15,2);not null" json:"sub_total"`
	CreatedAt		time.Time		`json:"created_at"`
}