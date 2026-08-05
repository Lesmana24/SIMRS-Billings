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

type ActionItemInput struct {
	ActionID uint `json:"action_id"`
	Quantity int  `json:"quantity"`
}

type CreateBillingRequest struct {
	PatientUserID     uint              `json:"patient_user_id"`
	PatientName       string            `json:"patient_name"`
	BPJSClaim         decimal.Decimal   `json:"bpjs_claim"`
	InsuranceProvider string            `json:"insurance_provider"`
	InsuranceClaim    decimal.Decimal   `json:"insurance_claim"`
	ActionIDs         []uint            `json:"action_ids"`
	Items             []ActionItemInput `json:"items"`
}

type UpdateBillingRequest struct {
	PatientName       string          `json:"patient_name"`
	BPJSClaim         decimal.Decimal `json:"bpjs_claim"`
	InsuranceProvider string          `json:"insurance_provider"`
	InsuranceClaim    decimal.Decimal `json:"insurance_claim"`
	Status            string          `json:"status"`
}

type ProcessPaymentRequest struct {
	BillingID      uint            `json:"billing_id"`
	IdempotencyKey string          `json:"idempotency_key"`
	ProofURL       string          `json:"proof_url"`
	PaymentMethod  string          `json:"payment_method"`
	CashAmount     decimal.Decimal `json:"cash_amount"`
	TransferAmount decimal.Decimal `json:"transfer_amount"`
}

func CreateBilling(req *CreateBillingRequest) (*models.MedicalBilling, error) {
	var patient models.User
	if req.PatientUserID > 0 {
		config.DB.First(&patient, req.PatientUserID)
	} else if req.PatientName != "" {
		config.DB.Where("username ILIKE ?", req.PatientName).First(&patient)
	}

	if req.PatientName == "" && patient.ID > 0 {
		req.PatientName = patient.Username
	}
	if req.PatientName == "" {
		return nil, errors.New("Nama pasien wajib dipilih atau diisi")
	}
	if patient.ID > 0 {
		req.PatientUserID = patient.ID
	}

	// Determine Insurance Provider and Claim Amount
	provider := req.InsuranceProvider
	if provider == "" {
		provider = "BPJS Kesehatan"
	}

	claimAmt := req.InsuranceClaim
	if claimAmt.IsZero() && !req.BPJSClaim.IsZero() {
		claimAmt = req.BPJSClaim
	}

	// Build map of actionID -> quantity
	actionQtyMap := make(map[uint]int)

	if len(req.Items) > 0 {
		for _, item := range req.Items {
			qty := item.Quantity
			if qty <= 0 {
				qty = 1
			}
			actionQtyMap[item.ActionID] = qty
		}
	} else if len(req.ActionIDs) > 0 {
		for _, id := range req.ActionIDs {
			actionQtyMap[id] = 1
		}
	}

	if len(actionQtyMap) == 0 {
		return nil, errors.New("Pilih minimal satu tindakan medis/tarif")
	}

	var actionIDs []uint
	for id := range actionQtyMap {
		actionIDs = append(actionIDs, id)
	}

	var tarifs []models.Tarif
	if err := config.DB.Where("id IN ?", actionIDs).Find(&tarifs).Error; err != nil {
		return nil, fmt.Errorf("Gagal mengambil Tarif: %w", err)
	}

	if len(tarifs) == 0 {
		return nil, errors.New("Tidak ada tarif ditemukan")
	}

	totalAmount := decimal.Zero
	var items []models.BillingItem

	for _, t := range tarifs {
		qty := actionQtyMap[t.ID]
		if qty <= 0 {
			qty = 1
		}
		subTotal := t.Amount.Mul(decimal.NewFromInt(int64(qty)))
		totalAmount = totalAmount.Add(subTotal)

		items = append(items, models.BillingItem{
			ItemName:  t.ActionName,
			UnitPrice: t.Amount,
			Quantity:  qty,
			SubTotal:  subTotal,
		})
	}

	patientAmount := totalAmount.Sub(claimAmt)
	if patientAmount.IsNegative() {
		patientAmount = decimal.Zero
	}

	billing := models.MedicalBilling{
		PatientUserID:     req.PatientUserID,
		PatientName:       req.PatientName,
		TotalAmount:       totalAmount,
		BPJSAmount:        claimAmt,
		InsuranceProvider: provider,
		InsuranceClaim:    claimAmt,
		PatientAmount:     patientAmount,
		Status:            "Pending",
		Items:             items,
	}

	if err := config.DB.Create(&billing).Error; err != nil {
		return nil, fmt.Errorf("Gagal membuat tagihan: %w", err)
	}

	return &billing, nil
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

		if method == "SPLIT" {
			if !cashAmt.Add(transferAmt).Equal(billing.PatientAmount) {
				return fmt.Errorf("Jumlah pembayaran split (Kasir: Rp %s + Transfer: Rp %s = Rp %s) harus SAMA PERSIS dengan total tagihan bersih (Rp %s)",
					cashAmt.StringFixed(0), transferAmt.StringFixed(0), cashAmt.Add(transferAmt).StringFixed(0), billing.PatientAmount.StringFixed(0))
			}
		} else if method == "CASH" {
			cashAmt = billing.PatientAmount
			transferAmt = decimal.Zero
		} else if method == "TRANSFER" || method == "EDC" {
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

	claimAmt := req.InsuranceClaim
	if claimAmt.IsZero() && !req.BPJSClaim.IsZero() {
		claimAmt = req.BPJSClaim
	}

	if req.InsuranceProvider != "" {
		updates["insurance_provider"] = req.InsuranceProvider
	}

	if !claimAmt.IsZero() {
		updates["insurance_claim"] = claimAmt
		updates["bpjs_amount"] = claimAmt
		newPatientAmount := billing.TotalAmount.Sub(claimAmt)
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

func DeletePaymentLedger(id uint) error {
	var ledger models.PaymentLedger
	if err := config.DB.First(&ledger, id).Error; err != nil {
		return errors.New("Jurnal mutasi kas tidak ditemukan")
	}
	return config.DB.Delete(&ledger).Error
}