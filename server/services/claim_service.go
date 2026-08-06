package services

import (
	"errors"
	"server/config"
	"server/models"
	"server/utils"
	"time"

	"github.com/shopspring/decimal"
)

type UpdateClaimStatusRequest struct {
	Status string `json:"status"`
}

type ClaimSummaryResponse struct {
	TotalBPJSAmount  decimal.Decimal `json:"total_bpjs_amount"`
	TotalUnclaimed   decimal.Decimal `json:"total_unclaimed"`
	TotalSubmitted   decimal.Decimal `json:"total_submitted"`
	TotalVerified    decimal.Decimal `json:"total_verified"`
	TotalPaid        decimal.Decimal `json:"total_paid"`
	CountUnclaimed   int64           `json:"count_unclaimed"`
	CountSubmitted   int64           `json:"count_submitted"`
	CountVerified    int64           `json:"count_verified"`
	CountPaid        int64           `json:"count_paid"`
}

func GetBPJSClaims(page, limit int, claimStatus, search string) ([]models.MedicalBilling, utils.Pagination, error) {
	var billings []models.MedicalBilling
	var totalRows int64

	db := config.DB.Model(&models.MedicalBilling{}).Where("bpjs_amount > ?", 0)

	if claimStatus != "" {
		db = db.Where("bpjs_claim_status = ?", claimStatus)
	}

	if search != "" {
		searchTerm := "%" + search + "%"
		db = db.Where("patient_name ILIKE ?", searchTerm)
	}

	db.Count(&totalRows)

	offset := (page - 1) * limit
	err := db.Preload("Items").Order("created_at desc").Offset(offset).Limit(limit).Find(&billings).Error
	if err != nil {
		return nil, utils.Pagination{}, err
	}

	meta := utils.CalculatePagination(totalRows, page, limit)
	return billings, meta, nil
}

func UpdateClaimStatus(id uint, newStatus string) (*models.MedicalBilling, error) {
	var billing models.MedicalBilling
	if err := config.DB.First(&billing, id).Error; err != nil {
		return nil, errors.New("Tagihan medis tidak ditemukan")
	}

	if billing.BPJSAmount.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("Tagihan ini tidak memiliki porsi klaim BPJS")
	}

	billing.BPJSClaimStatus = newStatus

	now := time.Now()
	if newStatus == "SUBMITTED" && billing.BPJSSubmissionDate == nil {
		billing.BPJSSubmissionDate = &now
	}
	if newStatus == "PAID" {
		billing.BPJSPaymentDate = &now
	}

	if err := config.DB.Save(&billing).Error; err != nil {
		return nil, err
	}

	return &billing, nil
}

func GetClaimSummary() (ClaimSummaryResponse, error) {
	var summary ClaimSummaryResponse

	// Initialize decimals
	summary.TotalBPJSAmount = decimal.Zero
	summary.TotalUnclaimed = decimal.Zero
	summary.TotalSubmitted = decimal.Zero
	summary.TotalVerified = decimal.Zero
	summary.TotalPaid = decimal.Zero

	type Result struct {
		BPJSClaimStatus string
		Total           decimal.Decimal
		Count           int64
	}

	var results []Result
	err := config.DB.Model(&models.MedicalBilling{}).
		Select("COALESCE(bpjs_claim_status, 'UNCLAIMED') as bpjs_claim_status, SUM(bpjs_amount) as total, COUNT(*) as count").
		Where("bpjs_amount > 0").
		Group("bpjs_claim_status").
		Scan(&results).Error

	if err != nil {
		return summary, err
	}

	for _, r := range results {
		summary.TotalBPJSAmount = summary.TotalBPJSAmount.Add(r.Total)
		switch r.BPJSClaimStatus {
		case "UNCLAIMED":
			summary.TotalUnclaimed = r.Total
			summary.CountUnclaimed = r.Count
		case "SUBMITTED":
			summary.TotalSubmitted = r.Total
			summary.CountSubmitted = r.Count
		case "VERIFIED":
			summary.TotalVerified = r.Total
			summary.CountVerified = r.Count
		case "PAID":
			summary.TotalPaid = r.Total
			summary.CountPaid = r.Count
		}
	}

	return summary, nil
}
