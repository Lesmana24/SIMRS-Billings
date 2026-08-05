package services

import (
	"errors"
	"fmt"
	"server/config"
	"server/models"
	"server/utils"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type CreateBillingRequest struct {
	PatientUserID uint            `json:"patient_user_id" binding:"required"`
	PatientName   string          `json:"patient_name"`
	BPJSClaim     decimal.Decimal `json:"bpjs_claim"`
	ActionIDs     []uint          `json:"action_ids" binding:"required"`
}

type UpdateBillingRequest struct {
	PatientName string          `json:"patient_name"`
	BPJSClaim   decimal.Decimal `json:"bpjs_claim"`
	Status      string          `json:"status"`
}

func CreateBilling(req *CreateBillingRequest) (*models.MedicalBilling, error) {
	var patient models.User
	if err := config.DB.First(&patient, req.PatientUserID).Error; err != nil {
		return nil, fmt.Errorf("Pasien dengan ID %d tidak ditemukan", req.PatientUserID)
	}

	if req.PatientName == "" {
		req.PatientName = patient.Username
	}

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

func ProcessPayment(billingID uint, idempotencyKey string, proofURL string) (*models.MedicalBilling, error) {
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

		updates := map[string]interface{}{
			"status": "PAID",
		}
		if proofURL != "" {
			updates["proof_of_payment"] = proofURL
		}

		if err := tx.Model(&billing).Updates(updates).Error; err != nil {
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
	return GetBillingByID(billingID)
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
		"status": "REJECTED",
	}

	if err := config.DB.Model(&billing).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("Gagal menolak pembayaran: %w", err)
	}

	return GetBillingByID(billingID)
}

func GetAllBillings(search, statusFilter string, page, limit int) ([]models.MedicalBilling, utils.Pagination, error) {
	var billings []models.MedicalBilling
	var totalRows int64

	query := config.DB.Model(&models.MedicalBilling{})
	if search != "" {
		query = query.Where("patient_name ILIKE ?", "%"+search+"%")
	}
	if statusFilter != "" {
		query = query.Where("status ILIKE ?", statusFilter)
	}

	if err := query.Count(&totalRows).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	offset := (page - 1) * limit
	if err := query.Preload("Items").Offset(offset).Limit(limit).Order("id desc").Find(&billings).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	pagination := utils.CalculatePagination(totalRows, page, limit)
	return billings, pagination, nil
}

func GetBillingByID(id uint) (*models.MedicalBilling, error) {
	var billing models.MedicalBilling
	if err := config.DB.Preload("Items").First(&billing, id).Error; err != nil {
		return nil, errors.New("Tagihan tidak ditemukan")
	}
	return &billing, nil
}

func UpdateBilling(id uint, req *UpdateBillingRequest) (*models.MedicalBilling, error) {
	billing, err := GetBillingByID(id)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.PatientName != "" {
		updates["patient_name"] = req.PatientName
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if !req.BPJSClaim.IsZero() {
		updates["bpjs_amount"] = req.BPJSClaim
		newPatientAmount := billing.TotalAmount.Sub(req.BPJSClaim)
		if newPatientAmount.IsNegative() {
			newPatientAmount = decimal.Zero
		}
		updates["patient_amount"] = newPatientAmount
	}

	if len(updates) > 0 {
		if err := config.DB.Model(billing).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return GetBillingByID(id)
}

func DeleteBilling(id uint) error {
	billing, err := GetBillingByID(id)
	if err != nil {
		return err
	}
	return config.DB.Select("Items").Delete(billing).Error
}

func GetPatientBillingsPaginated(patientUserID uint, search, statusFilter string, page, limit int) ([]models.MedicalBilling, utils.Pagination, error) {
	var billings []models.MedicalBilling
	var totalRows int64

	query := config.DB.Model(&models.MedicalBilling{}).Where("patient_user_id = ?", patientUserID)
	if search != "" {
		query = query.Where("patient_name ILIKE ?", "%"+search+"%")
	}
	if statusFilter != "" {
		query = query.Where("status ILIKE ?", statusFilter)
	}

	if err := query.Count(&totalRows).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	offset := (page - 1) * limit
	if err := query.Preload("Items").Offset(offset).Limit(limit).Order("id desc").Find(&billings).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	pagination := utils.CalculatePagination(totalRows, page, limit)
	return billings, pagination, nil
}

func GetPatientBillingByID(patientUserID, billingID uint) (*models.MedicalBilling, error) {
	var billing models.MedicalBilling
	if err := config.DB.Preload("Items").Where("patient_user_id = ?", patientUserID).First(&billing, billingID).Error; err != nil {
		return nil, errors.New("Tagihan tidak ditemukan atau tidak memiliki akses")
	}
	return &billing, nil
}

func GetPaymentLedgers(search, entryTypeFilter string, page, limit int) ([]models.PaymentLedger, utils.Pagination, error) {
	var ledgers []models.PaymentLedger
	var totalRows int64

	query := config.DB.Model(&models.PaymentLedger{})
	if search != "" {
		query = query.Where("description ILIKE ?", "%"+search+"%")
	}
	if entryTypeFilter != "" {
		query = query.Where("entry_type ILIKE ?", entryTypeFilter)
	}

	if err := query.Count(&totalRows).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("id desc").Find(&ledgers).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	pagination := utils.CalculatePagination(totalRows, page, limit)
	return ledgers, pagination, nil
}

func GetPaymentLedgerByID(id uint) (*models.PaymentLedger, error) {
	var ledger models.PaymentLedger
	if err := config.DB.First(&ledger, id).Error; err != nil {
		return nil, errors.New("Ledger pembayaran tidak ditemukan")
	}
	return &ledger, nil
}