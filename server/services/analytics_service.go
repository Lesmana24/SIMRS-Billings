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
	TotalBPJS            decimal.Decimal `json:"total_bpjs"`
	TotalPrivateIns      decimal.Decimal `json:"total_private_ins"`
	TotalPatient         decimal.Decimal `json:"total_patient"`
	TotalGross           decimal.Decimal `json:"total_gross"`
	BPJSPercentage       float64         `json:"bpjs_percentage"`
	PrivateInsPercentage float64         `json:"private_ins_percentage"`
	PatientPercentage    float64         `json:"patient_percentage"`
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
	SelectedMonth     int                `json:"selected_month"`
	SelectedYear      int                `json:"selected_year"`
}

func GetAnalyticsSummary(month, year int) (*AnalyticsSummary, error) {
	db := config.DB

	now := time.Now()
	if year <= 0 {
		year = now.Year()
	}
	if month <= 0 || month > 12 {
		month = int(now.Month())
	}

	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0)

	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	sevenDaysAgo := startOfToday.AddDate(0, 0, -6)

	var dailyRev, weeklyRev, monthlyRev, totalRev decimal.Decimal

	// 1. Daily Revenue (Today)
	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ?", "PAID", startOfToday).
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&dailyRev)

	// 2. Weekly Revenue (Past 7 Days)
	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ?", "PAID", sevenDaysAgo).
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&weeklyRev)

	// 3. Monthly Revenue (Selected Month & Year)
	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", startOfMonth, endOfMonth).
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&monthlyRev)

	// 4. All Time Total Revenue
	db.Model(&models.MedicalBilling{}).
		Where("status = ?", "PAID").
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&totalRev)

	// 5. BPJS Split vs Private Insurance vs Patient Direct Paid for Selected Month
	var totalBPJS, totalPrivateIns, totalPatient, totalGross decimal.Decimal
	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ? AND created_at < ? AND (insurance_provider = ? OR insurance_provider IS NULL OR insurance_provider = '')", "PAID", startOfMonth, endOfMonth, "BPJS Kesehatan").
		Select("COALESCE(SUM(bpjs_amount), 0)").Scan(&totalBPJS)

	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ? AND created_at < ? AND insurance_provider != ? AND insurance_provider != ''", "PAID", startOfMonth, endOfMonth, "BPJS Kesehatan").
		Select("COALESCE(SUM(insurance_claim), 0)").Scan(&totalPrivateIns)

	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", startOfMonth, endOfMonth).
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&totalPatient)

	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", startOfMonth, endOfMonth).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalGross)

	bpjsPct := 0.0
	privateInsPct := 0.0
	patientPct := 0.0
	if !totalGross.IsZero() {
		bpjsFloat, _ := totalBPJS.Float64()
		privateInsFloat, _ := totalPrivateIns.Float64()
		patientFloat, _ := totalPatient.Float64()
		grossFloat, _ := totalGross.Float64()

		bpjsPct = (bpjsFloat / grossFloat) * 100
		privateInsPct = (privateInsFloat / grossFloat) * 100
		patientPct = (patientFloat / grossFloat) * 100
	}

	// 6. Counts for Selected Month
	var paidCount, pendingCount int64
	db.Model(&models.MedicalBilling{}).Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", startOfMonth, endOfMonth).Count(&paidCount)
	db.Model(&models.MedicalBilling{}).Where("status != ? AND created_at >= ? AND created_at < ?", "PAID", startOfMonth, endOfMonth).Count(&pendingCount)

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

	// 8. Top Medical Actions for Selected Month
	type TopActionResult struct {
		ItemName    string          `gorm:"column:item_name"`
		TotalQty    int64           `gorm:"column:total_qty"`
		TotalAmount decimal.Decimal `gorm:"column:total_amount"`
	}

	var topResults []TopActionResult
	db.Table("billing_items").
		Select("billing_items.item_name as item_name, SUM(billing_items.quantity) as total_qty, SUM(billing_items.sub_total) as total_amount").
		Joins("JOIN medical_billings ON medical_billings.id = billing_items.billing_id").
		Where("medical_billings.status = ? AND medical_billings.created_at >= ? AND medical_billings.created_at < ? AND medical_billings.deleted_at IS NULL AND billing_items.deleted_at IS NULL", "PAID", startOfMonth, endOfMonth).
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
			TotalBPJS:            totalBPJS,
			TotalPrivateIns:      totalPrivateIns,
			TotalPatient:         totalPatient,
			TotalGross:           totalGross,
			BPJSPercentage:       bpjsPct,
			PrivateInsPercentage: privateInsPct,
			PatientPercentage:    patientPct,
		},
		DailyTrends:       dailyTrends,
		TopActions:        topActions,
		TotalPaidCount:    paidCount,
		TotalPendingCount: pendingCount,
		SelectedMonth:     month,
		SelectedYear:      year,
	}

	return summary, nil
}

func GenerateFinancialReportCSV(month, year int) ([]byte, error) {
	var billings []models.MedicalBilling
	query := config.DB.Preload("Items")

	if month > 0 && year > 0 {
		now := time.Now()
		startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, now.Location())
		endOfMonth := startOfMonth.AddDate(0, 1, 0)
		query = query.Where("created_at >= ? AND created_at < ?", startOfMonth, endOfMonth)
	}

	err := query.Order("created_at desc").Find(&billings).Error
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
		"Penyedia Asuransi",
		"Subsidi / Klaim Asuransi (IDR)",
		"Tagihan Bersih Pasien (IDR)",
		"Metode Pembayaran",
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

		provider := b.InsuranceProvider
		if provider == "" {
			provider = "BPJS Kesehatan"
		}

		claimVal := b.InsuranceClaim
		if claimVal.IsZero() {
			claimVal = b.BPJSAmount
		}

		method := b.PaymentMethod
		if method == "" {
			method = "CASH"
		}

		record := []string{
			fmt.Sprintf("BILL-%d", b.ID),
			b.CreatedAt.Format("2006-01-02 15:04:05"),
			b.PatientName,
			itemsStr,
			b.TotalAmount.StringFixed(0),
			provider,
			claimVal.StringFixed(0),
			b.PatientAmount.StringFixed(0),
			method,
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
