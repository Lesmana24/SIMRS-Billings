package services

import (
	"errors"
	"fmt"
	"server/config"
	"server/models"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type CreateBillingRequest struct {
	PatientUserID uint            `json:"patient_user_id" binding:"required"`
	PatientName   string          `json:"patient_name" binding:"required"`
	BPJSClaim     decimal.Decimal `json:"bpjs_claim"`
	ActionIDs     []uint          `json:"action_ids" binding:"required"`
}

func CreateBilling(req *CreateBillingRequest) (*models.MedicalBilling, error) {
	var tarifs []models.Tarif
	if err := config.DB.Where("id IN ?", req.ActionIDs).Find(&tarifs).Error; err != nil {
		return nil, fmt.Errorf("Gagal mengambil Tarif: %w", err)
	}

	if len(tarifs) == 0 {
		return nil, errors.New("Tidak ada tarif ditemukan")
	}

	totalAmount := decimal.Zero
	var items []models.BillingItem

	for _, t := range tarifs {
		qty := 1
		subTotal := t.Amount.Mul(decimal.NewFromInt(int64(qty)))
		totalAmount = totalAmount.Add(subTotal)

		items = append(items, models.BillingItem{
			ItemName:  t.ActionName,
			UnitPrice: t.Amount,
			Quantity:  qty,
			SubTotal:  subTotal,
		})
	}

	patientAmount := totalAmount.Sub(req.BPJSClaim)
	if patientAmount.IsNegative() {
		patientAmount = decimal.Zero
	}

	billing := models.MedicalBilling{
		PatientUserID: req.PatientUserID,
		PatientName:   req.PatientName,
		TotalAmount:   totalAmount,
		BPJSAmount:    req.BPJSClaim,
		PatientAmount: patientAmount,
		Status:        "Pending",
		Items:         items,
	}

	if err := config.DB.Create(&billing).Error; err != nil {
		return nil, fmt.Errorf("Gagal membuat tagihan: %w", err)
	}

	return &billing, nil
}

func ProcessPayment(billingID uint, idempotencyKey string) (*models.MedicalBilling, error) {
	var billing models.MedicalBilling
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var existingLog models.IdempotencyLog
		if err := tx.Where("idempotency_key = ?", idempotencyKey).First(&existingLog).Error; err == nil {
			return tx.Preload("Items").First(&billing, billingID).Error
		}
		if err := tx.First(&billing, billingID).Error; err != nil {
			return errors.New("Tagihan tidak ditemukan")
		}
		if billing.Status == "PAID" {
			return errors.New("Tagihan sudah Lunas sebelumnya")
		}
		if err := tx.Model(&billing).Update("status", "PAID").Error; err != nil {
			return err
		}
		ledger := models.PaymentLedger{
			BillingID:   billingID,
			EntryType:   "DEBIT",
			Amount:      billing.PatientAmount,
			Description: fmt.Sprintf("Pembayaran Tagihan pasien %s", billing.PatientName),
		}
		if err := tx.Create(&ledger).Error; err != nil {
			return err
		}
		logEntry := models.IdempotencyLog{
			IdempotencyKey: idempotencyKey,
			ResponseBody:   "PAID",
		}
		if err := tx.Create(&logEntry).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &billing, nil
}

func GetPatientBillings(patientUserID uint) ([]models.MedicalBilling, error) {
	var billings []models.MedicalBilling
	err := config.DB.Preload("Items").Where("patient_user_id = ?", patientUserID).Find(&billings).Error
	return billings, err
}