package repository

import (
	"time"

	"gorm.io/gorm"
)

// WithInsuranceClaim filters billings that have insurance or BPJS claims
func WithInsuranceClaim() func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("bpjs_amount > 0 OR insurance_claim > 0")
	}
}

// ByProviderType filters billings by provider category ('bpjs', 'swasta', or all)
func ByProviderType(providerType string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		switch providerType {
		case "bpjs":
			return db.Where("LOWER(insurance_provider) LIKE ?", "%bpjs%")
		case "swasta":
			return db.Where("LOWER(insurance_provider) NOT LIKE ? AND LOWER(insurance_provider) NOT LIKE ?", "%bpjs%", "%tanpa asuransi%")
		default:
			return db
		}
	}
}

// ByClaimStatus filters billings by BPJS/Insurance claim status
func ByClaimStatus(status string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == "" {
			return db
		}
		return db.Where("bpjs_claim_status = ?", status)
	}
}

// ByBillingStatus filters billings by overall payment status (PAID, PENDING)
func ByBillingStatus(status string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == "" {
			return db
		}
		return db.Where("status = ?", status)
	}
}

// ByDateRange filters billings by created_at timestamp range [start, end)
func ByDateRange(start, end time.Time) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if start.IsZero() && end.IsZero() {
			return db
		}
		if !start.IsZero() && !end.IsZero() {
			return db.Where("created_at >= ? AND created_at < ?", start, end)
		}
		if !start.IsZero() {
			return db.Where("created_at >= ?", start)
		}
		return db.Where("created_at < ?", end)
	}
}
