package services

import (
	"errors"
	"fmt"
	"server/config"
	"server/models"
	"server/utils"

	"github.com/shopspring/decimal"
)

type ActionItemInput struct {
	ActionID uint `json:"action_id"`
	TarifID  uint `json:"tarif_id"`
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
			id := item.ActionID
			if id == 0 {
				id = item.TarifID
			}
			if id > 0 {
				qty := item.Quantity
				if qty <= 0 {
					qty = 1
				}
				actionQtyMap[id] = qty
			}
		}
	}

	if len(actionQtyMap) == 0 && len(req.ActionIDs) > 0 {
		for _, id := range req.ActionIDs {
			if id > 0 {
				actionQtyMap[id] = 1
			}
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