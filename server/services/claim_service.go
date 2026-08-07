package services

import (
	"errors"
	"fmt"
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

func GetBPJSClaims(page, limit int, claimStatus, search, providerType string) ([]models.MedicalBilling, utils.Pagination, error) {
	var billings []models.MedicalBilling
	var totalRows int64

	db := config.DB.Model(&models.MedicalBilling{}).Where("bpjs_amount > 0 OR insurance_claim > 0")

	if providerType == "bpjs" {
		db = db.Where("LOWER(insurance_provider) LIKE ?", "%bpjs%")
	} else if providerType == "swasta" {
		db = db.Where("LOWER(insurance_provider) NOT LIKE ? AND LOWER(insurance_provider) NOT LIKE ?", "%bpjs%", "%tanpa asuransi%")
	}

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

	if billing.BPJSAmount.LessThanOrEqual(decimal.Zero) && billing.InsuranceClaim.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("Tagihan ini tidak memiliki porsi klaim penjamin/asuransi")
	}

	previousStatus := billing.BPJSClaimStatus
	billing.BPJSClaimStatus = newStatus

	now := time.Now()
	if newStatus == "SUBMITTED" && billing.BPJSSubmissionDate == nil {
		billing.BPJSSubmissionDate = &now
	}
	if newStatus == "PAID" {
		billing.BPJSPaymentDate = &now

		// If patient portion is 0 or already paid, update overall billing status to PAID
		if billing.PatientAmount.LessThanOrEqual(decimal.Zero) {
			billing.Status = "PAID"
		}

		// Record PaymentLedger (Jurnal Mutasi Kas) if claim status transitioned to PAID
		if previousStatus != "PAID" {
			claimAmt := billing.InsuranceClaim
			if claimAmt.IsZero() {
				claimAmt = billing.BPJSAmount
			}

			if claimAmt.GreaterThan(decimal.Zero) {
				provider := billing.InsuranceProvider
				if provider == "" {
					provider = "BPJS Kesehatan"
				}

				ledger := models.PaymentLedger{
					BillingID:   billing.ID,
					EntryType:   "DEBIT",
					Amount:      claimAmt,
					Description: fmt.Sprintf("Pencairan dana klaim %s pasien %s (#BILL-%d)", provider, billing.PatientName, billing.ID),
				}
				config.DB.Create(&ledger)
			}
		}
	}

	if err := config.DB.Save(&billing).Error; err != nil {
		return nil, err
	}

	return &billing, nil
}

func GetClaimSummary(providerType string) (ClaimSummaryResponse, error) {
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

	db := config.DB.Model(&models.MedicalBilling{}).Where("bpjs_amount > 0 OR insurance_claim > 0")

	if providerType == "bpjs" {
		db = db.Where("LOWER(insurance_provider) LIKE ?", "%bpjs%")
	} else if providerType == "swasta" {
		db = db.Where("LOWER(insurance_provider) NOT LIKE ? AND LOWER(insurance_provider) NOT LIKE ?", "%bpjs%", "%tanpa asuransi%")
	}

	var results []Result
	err := db.Select("COALESCE(bpjs_claim_status, 'UNCLAIMED') as bpjs_claim_status, SUM(COALESCE(NULLIF(insurance_claim, 0), bpjs_amount)) as total, COUNT(*) as count").
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

func SyncClaimLedgers() {
	var billings []models.MedicalBilling
	config.DB.Where("bpjs_claim_status = ? AND (bpjs_amount > 0 OR insurance_claim > 0)", "PAID").Find(&billings)

	for _, b := range billings {
		claimAmt := b.InsuranceClaim
		if claimAmt.IsZero() {
			claimAmt = b.BPJSAmount
		}

		if claimAmt.GreaterThan(decimal.Zero) {
			var count int64
			provider := b.InsuranceProvider
			if provider == "" {
				provider = "BPJS Kesehatan"
			}
			desc := fmt.Sprintf("Pencairan dana klaim %s pasien %s (#BILL-%d)", provider, b.PatientName, b.ID)

			config.DB.Model(&models.PaymentLedger{}).
				Where("billing_id = ? AND description LIKE ?", b.ID, "%Pencairan dana klaim%").
				Count(&count)

			if count == 0 {
				ledger := models.PaymentLedger{
					BillingID:   b.ID,
					EntryType:   "DEBIT",
					Amount:      claimAmt,
					Description: desc,
					CreatedAt:   b.CreatedAt,
				}
				config.DB.Create(&ledger)

				if b.PatientAmount.LessThanOrEqual(decimal.Zero) && b.Status != "PAID" {
					b.Status = "PAID"
					config.DB.Save(&b)
				}
			}
		}
	}
}
