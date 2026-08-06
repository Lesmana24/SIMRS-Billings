package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type MedicalBilling struct {
	gorm.Model
	PatientUserID     uint            `gorm:"not null" json:"patient_user_id"`
	PatientName       string          `gorm:"not null" json:"patient_name"`
	TotalAmount       decimal.Decimal `gorm:"type:decimal(15,2);not null" json:"total_amount"`
	BPJSAmount        decimal.Decimal `gorm:"type:decimal(15,2);not null" json:"bpjs_amount"`
	InsuranceProvider string          `gorm:"type:varchar(100);default:'BPJS Kesehatan'" json:"insurance_provider"`
	InsuranceClaim    decimal.Decimal `gorm:"type:decimal(15,2);default:0" json:"insurance_claim"`
	PatientAmount     decimal.Decimal `gorm:"type:decimal(15,2);not null" json:"patient_amount"`
	PaymentMethod     string          `gorm:"type:varchar(50);default:'CASH'" json:"payment_method"`
	CashAmount        decimal.Decimal `gorm:"type:decimal(15,2);default:0" json:"cash_amount"`
	TransferAmount    decimal.Decimal `gorm:"type:decimal(15,2);default:0" json:"transfer_amount"`
	Status            string          `gorm:"not null;default:'Pending'" json:"status"`
	BPJSClaimStatus   string          `gorm:"type:varchar(50);default:'UNCLAIMED'" json:"bpjs_claim_status"`
	BPJSSubmissionDate *time.Time     `json:"bpjs_submission_date,omitempty"`
	BPJSPaymentDate   *time.Time      `json:"bpjs_payment_date,omitempty"`
	ProofOfPayment    string          `gorm:"type:text" json:"proof_of_payment,omitempty"`
	Items             []BillingItem   `gorm:"foreignKey:BillingID" json:"item,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
}