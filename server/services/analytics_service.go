package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"server/config"
	"server/models"
	"time"

	"github.com/shopspring/decimal"
)

type PeriodSummary struct {
	DailyRevenue   decimal.Decimal `json:"daily_revenue"`
	WeeklyRevenue  decimal.Decimal `json:"weekly_revenue"`
	MonthlyRevenue decimal.Decimal `json:"monthly_revenue"`
	TotalRevenue   decimal.Decimal `json:"total_revenue"`
}

type DailyTrend struct {
	Date          string          `json:"date"`
	TotalAmount   decimal.Decimal `json:"total_amount"`
	PatientAmount decimal.Decimal `json:"patient_amount"`
	BPJSAmount    decimal.Decimal `json:"bpjs_amount"`
	Count         int64           `json:"count"`
}

type BPJSSplit struct {
	TotalBPJS         decimal.Decimal `json:"total_bpjs"`
	TotalPatient      decimal.Decimal `json:"total_patient"`
	TotalGross        decimal.Decimal `json:"total_gross"`
	BPJSPercentage    float64         `json:"bpjs_percentage"`
	PatientPercentage float64         `json:"patient_percentage"`
}

type TopMedicalAction struct {
	ItemName    string          `json:"item_name"`
	TotalQty    int64           `json:"total_qty"`
	TotalAmount decimal.Decimal `json:"total_amount"`
}

type AnalyticsSummary struct {
	Periods           PeriodSummary      `json:"periods"`
	BPJSSplit         BPJSSplit          `json:"bpjs_split"`
	DailyTrends       []DailyTrend       `json:"daily_trends"`
	TopActions        []TopMedicalAction `json:"top_actions"`
	TotalPaidCount    int64              `json:"total_paid_count"`
	TotalPendingCount int64              `json:"total_pending_count"`
}

func GetAnalyticsSummary() (*AnalyticsSummary, error) {
	db := config.DB

	now := time.Now()
	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	sevenDaysAgo := startOfToday.AddDate(0, 0, -6)
	thirtyDaysAgo := startOfToday.AddDate(0, 0, -29)

	var dailyRev, weeklyRev, monthlyRev, totalRev decimal.Decimal

	// 1. Daily Revenue (Today)
	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ?", "PAID", startOfToday).
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&dailyRev)

	// 2. Weekly Revenue (Past 7 Days)
	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ?", "PAID", sevenDaysAgo).
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&weeklyRev)

	// 3. Monthly Revenue (Past 30 Days)
	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ?", "PAID", thirtyDaysAgo).
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&monthlyRev)

	// 4. All Time Total Revenue
	db.Model(&models.MedicalBilling{}).
		Where("status = ?", "PAID").
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&totalRev)

	// 5. BPJS Split vs Patient Direct Paid
	var totalBPJS, totalPatient, totalGross decimal.Decimal
	db.Model(&models.MedicalBilling{}).
		Where("status = ?", "PAID").
		Select("COALESCE(SUM(bpjs_amount), 0)").Scan(&totalBPJS)

	db.Model(&models.MedicalBilling{}).
		Where("status = ?", "PAID").
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&totalPatient)

	db.Model(&models.MedicalBilling{}).
		Where("status = ?", "PAID").
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalGross)

	bpjsPct := 0.0
	patientPct := 0.0
	if !totalGross.IsZero() {
		bpjsFloat, _ := totalBPJS.Float64()
		patientFloat, _ := totalPatient.Float64()
		grossFloat, _ := totalGross.Float64()
		bpjsPct = (bpjsFloat / grossFloat) * 100
		patientPct = (patientFloat / grossFloat) * 100
	}

	// 6. Counts
	var paidCount, pendingCount int64
	db.Model(&models.MedicalBilling{}).Where("status = ?", "PAID").Count(&paidCount)
	db.Model(&models.MedicalBilling{}).Where("status != ?", "PAID").Count(&pendingCount)

	// 7. Daily Trends for past 7 days
	var dailyTrends []DailyTrend
	for i := 6; i >= 0; i-- {
		dayStart := startOfToday.AddDate(0, 0, -i)
		dayEnd := dayStart.AddDate(0, 0, 1)
		dateStr := dayStart.Format("02 Jan")

		var totAmt, patAmt, bpjsAmt decimal.Decimal
		var cnt int64

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", dayStart, dayEnd).
			Select("COALESCE(SUM(total_amount), 0)").Scan(&totAmt)

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", dayStart, dayEnd).
			Select("COALESCE(SUM(patient_amount), 0)").Scan(&patAmt)

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", dayStart, dayEnd).
			Select("COALESCE(SUM(bpjs_amount), 0)").Scan(&bpjsAmt)

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", dayStart, dayEnd).
			Count(&cnt)

		dailyTrends = append(dailyTrends, DailyTrend{
			Date:          dateStr,
			TotalAmount:   totAmt,
			PatientAmount: patAmt,
			BPJSAmount:    bpjsAmt,
			Count:         cnt,
		})
	}

	// 8. Top Medical Actions
	type TopActionResult struct {
		ItemName    string          `gorm:"column:item_name"`
		TotalQty    int64           `gorm:"column:total_qty"`
		TotalAmount decimal.Decimal `gorm:"column:total_amount"`
	}

	var topResults []TopActionResult
	db.Table("billing_items").
		Select("billing_items.item_name as item_name, SUM(billing_items.quantity) as total_qty, SUM(billing_items.sub_total) as total_amount").
		Joins("JOIN medical_billings ON medical_billings.id = billing_items.billing_id").
		Where("medical_billings.status = ? AND medical_billings.deleted_at IS NULL AND billing_items.deleted_at IS NULL", "PAID").
		Group("billing_items.item_name").
		Order("total_qty DESC").
		Limit(5).
		Scan(&topResults)

	var topActions []TopMedicalAction
	for _, res := range topResults {
		topActions = append(topActions, TopMedicalAction{
			ItemName:    res.ItemName,
			TotalQty:    res.TotalQty,
			TotalAmount: res.TotalAmount,
		})
	}

	summary := &AnalyticsSummary{
		Periods: PeriodSummary{
			DailyRevenue:   dailyRev,
			WeeklyRevenue:  weeklyRev,
			MonthlyRevenue: monthlyRev,
			TotalRevenue:   totalRev,
		},
		BPJSSplit: BPJSSplit{
			TotalBPJS:         totalBPJS,
			TotalPatient:      totalPatient,
			TotalGross:        totalGross,
			BPJSPercentage:    bpjsPct,
			PatientPercentage: patientPct,
		},
		DailyTrends:       dailyTrends,
		TopActions:        topActions,
		TotalPaidCount:    paidCount,
		TotalPendingCount: pendingCount,
	}

	return summary, nil
}

func GenerateFinancialReportCSV() ([]byte, error) {
	var billings []models.MedicalBilling
	err := config.DB.Preload("Items").Order("created_at desc").Find(&billings).Error
	if err != nil {
		return nil, err
	}

	buf := new(bytes.Buffer)

	// Write UTF-8 BOM for Microsoft Excel compatibility
	buf.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(buf)

	// Write Headers
	header := []string{
		"ID Tagihan",
		"Tanggal Transaksi",
		"Nama Pasien",
		"Detail Tindakan Medis",
		"Total Billing (IDR)",
		"Subsidi BPJS (IDR)",
		"Tagihan Bersih Pasien (IDR)",
		"Status",
		"Bukti Pembayaran",
	}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	for _, b := range billings {
		itemsStr := ""
		for idx, itm := range b.Items {
			if idx > 0 {
				itemsStr += " | "
			}
			itemsStr += fmt.Sprintf("%s (%dx Rp %s)", itm.ItemName, itm.Quantity, itm.UnitPrice.StringFixed(0))
		}

		record := []string{
			fmt.Sprintf("BILL-%d", b.ID),
			b.CreatedAt.Format("2006-01-02 15:04:05"),
			b.PatientName,
			itemsStr,
			b.TotalAmount.StringFixed(0),
			b.BPJSAmount.StringFixed(0),
			b.PatientAmount.StringFixed(0),
			b.Status,
			b.ProofOfPayment,
		}

		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	return buf.Bytes(), nil
}
