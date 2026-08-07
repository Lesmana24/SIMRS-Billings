package services

import (
	"errors"
	"fmt"
	"server/config"
	"server/models"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type ProcessPaymentRequest struct {
	BillingID      uint            `json:"billing_id"`
	IdempotencyKey string          `json:"idempotency_key"`
	ProofURL       string          `json:"proof_url"`
	PaymentMethod  string          `json:"payment_method"`
	CashAmount     decimal.Decimal `json:"cash_amount"`
	TransferAmount decimal.Decimal `json:"transfer_amount"`
}

func ProcessPayment(billingID uint, idempotencyKey string, proofURL string) (*models.MedicalBilling, error) {
	return ProcessPaymentDetailed(&ProcessPaymentRequest{
		BillingID:      billingID,
		IdempotencyKey: idempotencyKey,
		ProofURL:       proofURL,
	})
}

func ProcessPaymentDetailed(req *ProcessPaymentRequest) (*models.MedicalBilling, error) {
	var billing models.MedicalBilling
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var existingLog models.IdempotencyLog
		if err := tx.Where("idempotency_key = ?", req.IdempotencyKey).First(&existingLog).Error; err == nil {
			return tx.Preload("Items").First(&billing, req.BillingID).Error
		}
		if err := tx.First(&billing, req.BillingID).Error; err != nil {
			return errors.New("Tagihan tidak ditemukan")
		}
		if billing.Status == "PAID" {
			return errors.New("Tagihan sudah Lunas sebelumnya")
		}

		method := req.PaymentMethod
		if method == "" {
			if req.ProofURL != "" {
				method = "TRANSFER"
			} else {
				method = "CASH"
			}
		}

		cashAmt := req.CashAmount
		transferAmt := req.TransferAmount

		switch method {
		case "SPLIT":
			if !cashAmt.Add(transferAmt).Equal(billing.PatientAmount) {
				return fmt.Errorf("Jumlah pembayaran split (Kasir: Rp %s + Transfer: Rp %s = Rp %s) harus SAMA PERSIS dengan total tagihan bersih (Rp %s)",
					cashAmt.StringFixed(0), transferAmt.StringFixed(0), cashAmt.Add(transferAmt).StringFixed(0), billing.PatientAmount.StringFixed(0))
			}
		case "CASH":
			cashAmt = billing.PatientAmount
			transferAmt = decimal.Zero
		case "TRANSFER", "EDC":
			transferAmt = billing.PatientAmount
			cashAmt = decimal.Zero
		}

		updates := map[string]interface{}{
			"status":           "PAID",
			"proof_of_payment": req.ProofURL,
			"payment_method":   method,
			"cash_amount":      cashAmt,
			"transfer_amount":  transferAmt,
		}

		if err := tx.Model(&billing).Updates(updates).Error; err != nil {
			return err
		}

		// Write Payment Ledgers
		if method == "SPLIT" {
			if !cashAmt.IsZero() {
				ledgerCash := models.PaymentLedger{
					BillingID:   req.BillingID,
					EntryType:   "DEBIT (CASH)",
					Amount:      cashAmt,
					Description: fmt.Sprintf("Pembayaran Kasir Tunai (Split) pasien %s", billing.PatientName),
				}
				if err := tx.Create(&ledgerCash).Error; err != nil {
					return err
				}
			}
			if !transferAmt.IsZero() {
				ledgerTransfer := models.PaymentLedger{
					BillingID:   req.BillingID,
					EntryType:   "DEBIT (TRANSFER)",
					Amount:      transferAmt,
					Description: fmt.Sprintf("Pembayaran Transfer Bank/EDC (Split) pasien %s", billing.PatientName),
				}
				if err := tx.Create(&ledgerTransfer).Error; err != nil {
					return err
				}
			}
		} else {
			ledger := models.PaymentLedger{
				BillingID:   req.BillingID,
				EntryType:   fmt.Sprintf("DEBIT (%s)", method),
				Amount:      billing.PatientAmount,
				Description: fmt.Sprintf("Pembayaran Tagihan (%s) pasien %s", method, billing.PatientName),
			}
			if err := tx.Create(&ledger).Error; err != nil {
				return err
			}
		}

		logEntry := models.IdempotencyLog{
			IdempotencyKey: req.IdempotencyKey,
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
	return GetBillingByID(req.BillingID)
}

func SubmitPaymentProof(billingID uint, proofURL string) (*models.MedicalBilling, error) {
	var billing models.MedicalBilling
	if err := config.DB.First(&billing, billingID).Error; err != nil {
		return nil, errors.New("Tagihan tidak ditemukan")
	}

	if billing.Status == "PAID" {
		return nil, errors.New("Tagihan sudah Lunas sebelumnya")
	}

	updates := map[string]interface{}{
		"status":           "WAITING_VERIFICATION",
		"proof_of_payment": proofURL,
		"payment_method":   "TRANSFER",
	}

	if err := config.DB.Model(&billing).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("Gagal memperbarui bukti pembayaran: %w", err)
	}

	return GetBillingByID(billingID)
}

func RejectPayment(billingID uint) (*models.MedicalBilling, error) {
	var billing models.MedicalBilling
	if err := config.DB.First(&billing, billingID).Error; err != nil {
		return nil, errors.New("Tagihan tidak ditemukan")
	}

	if billing.Status == "PAID" {
		return nil, errors.New("Tagihan sudah Lunas, tidak dapat ditolak")
	}

	updates := map[string]interface{}{
		"status":           "REJECTED",
		"proof_of_payment": "",
	}

	if err := config.DB.Model(&billing).Select("status", "proof_of_payment").Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("Gagal menolak pembayaran: %w", err)
	}

	return GetBillingByID(billingID)
}
