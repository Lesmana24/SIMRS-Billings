package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type MedicalBilling struct {
	gorm.Model
	PatientUserID		uint			`gorm:"not null" json:"patient_user_id"`
	PatientName			string			`gorm:"not null" json:"patient_name"`
	TotalAmount			decimal.Decimal	`gorm:"type:decimal(15,2);not null" json:"total_amount"`
	BPJSAmount			decimal.Decimal	`gorm:"type:decimal(15,2);not null" json:"bpjs_amount"`
	PatientAmount		decimal.Decimal	`gorm:"type:decimal(15,2);not null" json:"patient_amount"`
	Status				string			`gorm:"not null;default:'pending'" json:"status"`
	Items				[]BillingItem	`gorm:"foreignKey:BillingID" json:"item,omitempty"`
	CreatedAt			time.Time		`json:"created_at"`
}