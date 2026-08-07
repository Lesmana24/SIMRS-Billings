package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"server/config"
	"server/models"
	"time"

	"github.com/shopspring/decimal"
	"github.com/xuri/excelize/v2"
)

type PeriodSummary struct {
	DailyRevenue   decimal.Decimal `json:"daily_revenue"`
	WeeklyRevenue  decimal.Decimal `json:"weekly_revenue"`
	MonthlyRevenue decimal.Decimal `json:"monthly_revenue"`
	TotalRevenue   decimal.Decimal `json:"total_revenue"`
}

type DailyTrend struct {
	Date            string          `json:"date"`
	TotalAmount     decimal.Decimal `json:"total_amount"`
	PatientAmount   decimal.Decimal `json:"patient_amount"`
	BPJSAmount      decimal.Decimal `json:"bpjs_amount"`
	InsuranceAmount decimal.Decimal `json:"insurance_amount"`
	Count           int64           `json:"count"`
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

	// Auto sync ledgers for any PAID claims
	SyncClaimLedgers()

	// 1. Daily Revenue (Today) - Actual Cash Receipts in Ledger
	db.Model(&models.PaymentLedger{}).
		Where("entry_type = ? AND created_at >= ?", "DEBIT", startOfToday).
		Select("COALESCE(SUM(amount), 0)").Scan(&dailyRev)

	// 2. Weekly Revenue (Past 7 Days)
	db.Model(&models.PaymentLedger{}).
		Where("entry_type = ? AND created_at >= ?", "DEBIT", sevenDaysAgo).
		Select("COALESCE(SUM(amount), 0)").Scan(&weeklyRev)

	// 3. Monthly Revenue (Selected Month & Year)
	db.Model(&models.PaymentLedger{}).
		Where("entry_type = ? AND created_at >= ? AND created_at < ?", "DEBIT", startOfMonth, endOfMonth).
		Select("COALESCE(SUM(amount), 0)").Scan(&monthlyRev)

	// 4. All Time Total Revenue
	db.Model(&models.PaymentLedger{}).
		Where("entry_type = ?", "DEBIT").
		Select("COALESCE(SUM(amount), 0)").Scan(&totalRev)

	// 5. BPJS Split vs Private Insurance vs Patient Direct Paid for Selected Month
	var totalBPJS, totalPrivateIns, totalPatient, totalGross decimal.Decimal
	db.Model(&models.MedicalBilling{}).
		Where("bpjs_claim_status = ? AND created_at >= ? AND created_at < ? AND LOWER(insurance_provider) LIKE ?", "PAID", startOfMonth, endOfMonth, "%bpjs%").
		Select("COALESCE(SUM(COALESCE(NULLIF(insurance_claim, 0), bpjs_amount)), 0)").Scan(&totalBPJS)

	db.Model(&models.MedicalBilling{}).
		Where("bpjs_claim_status = ? AND created_at >= ? AND created_at < ? AND LOWER(insurance_provider) NOT LIKE ? AND LOWER(insurance_provider) NOT LIKE ?", "PAID", startOfMonth, endOfMonth, "%bpjs%", "%tanpa asuransi%").
		Select("COALESCE(SUM(COALESCE(NULLIF(insurance_claim, 0), bpjs_amount)), 0)").Scan(&totalPrivateIns)

	db.Model(&models.MedicalBilling{}).
		Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", startOfMonth, endOfMonth).
		Select("COALESCE(SUM(patient_amount), 0)").Scan(&totalPatient)

	totalGross = totalBPJS.Add(totalPrivateIns).Add(totalPatient)

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

		var totAmt, patAmt, bpjsAmt, insAmt decimal.Decimal
		var cnt int64

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", dayStart, dayEnd).
			Select("COALESCE(SUM(total_amount), 0)").Scan(&totAmt)

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", dayStart, dayEnd).
			Select("COALESCE(SUM(patient_amount), 0)").Scan(&patAmt)

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ? AND (insurance_provider = ? OR insurance_provider IS NULL OR insurance_provider = '')", "PAID", dayStart, dayEnd, "BPJS Kesehatan").
			Select("COALESCE(SUM(bpjs_amount), 0)").Scan(&bpjsAmt)

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ? AND insurance_provider != ? AND insurance_provider != ''", "PAID", dayStart, dayEnd, "BPJS Kesehatan").
			Select("COALESCE(SUM(insurance_claim), 0)").Scan(&insAmt)

		db.Model(&models.MedicalBilling{}).
			Where("status = ? AND created_at >= ? AND created_at < ?", "PAID", dayStart, dayEnd).
			Count(&cnt)

		dailyTrends = append(dailyTrends, DailyTrend{
			Date:            dateStr,
			TotalAmount:     totAmt,
			PatientAmount:   patAmt,
			BPJSAmount:      bpjsAmt,
			InsuranceAmount: insAmt,
			Count:           cnt,
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

	var totalGross, totalBPJS, totalPatient decimal.Decimal

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

		totalGross = totalGross.Add(b.TotalAmount)
		totalBPJS = totalBPJS.Add(claimVal)
		totalPatient = totalPatient.Add(b.PatientAmount)

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

	// Write empty line and Summary Row
	writer.Write([]string{})
	writer.Write([]string{
		"TOTAL KESELURUHAN",
		"",
		"",
		fmt.Sprintf("Total %d Transaksi Billing", len(billings)),
		totalGross.StringFixed(0),
		"",
		totalBPJS.StringFixed(0),
		totalPatient.StringFixed(0),
		"",
		"",
		"",
	})

	writer.Flush()
	return buf.Bytes(), nil
}

func GenerateFinancialReportExcel(month, year int) ([]byte, error) {
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

	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Laporan Kas SIMRS"
	sheetIdx, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(sheetIdx)
	_ = f.DeleteSheet("Sheet1")

	// Apply Styles
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF", Size: 11},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"1E293B"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
	})

	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 16, Color: "0F172A"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
	})

	totalStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "0F172A", Size: 11},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"F1F5F9"}, Pattern: 1},
		Border: []excelize.Border{
			{Type: "top", Color: "94A3B8", Style: 1},
			{Type: "bottom", Color: "94A3B8", Style: 2},
		},
	})

	// Write Title Block
	_ = f.SetCellValue(sheetName, "A1", "LAPORAN KAS & AKUNTANSI SIMRS BILLING ENGINE")
	_ = f.SetCellStyle(sheetName, "A1", "A1", titleStyle)
	
	periodStr := "Semua Periode Transaksi"
	if month > 0 && year > 0 {
		periodStr = fmt.Sprintf("Periode: Bulan %d Tahun %d", month, year)
	}
	_ = f.SetCellValue(sheetName, "A2", periodStr)

	// Write Table Headers at Row 4
	headers := []string{
		"ID Tagihan", "Tanggal Transaksi", "Nama Pasien", "Detail Tindakan Medis",
		"Total Billing (IDR)", "Penyedia Asuransi", "Subsidi / Klaim Asuransi (IDR)",
		"Tagihan Bersih Pasien (IDR)", "Metode Pembayaran", "Status", "Bukti Pembayaran",
	}

	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 4)
		_ = f.SetCellValue(sheetName, cell, h)
	}
	_ = f.SetCellStyle(sheetName, "A4", "K4", headerStyle)
	_ = f.SetRowHeight(sheetName, 4, 28)

	// Write Data Rows starting Row 5
	var totalGross, totalBPJS, totalPatient decimal.Decimal
	rowIdx := 5

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

		totalGross = totalGross.Add(b.TotalAmount)
		totalBPJS = totalBPJS.Add(claimVal)
		totalPatient = totalPatient.Add(b.PatientAmount)

		grossFloat, _ := b.TotalAmount.Float64()
		claimFloat, _ := claimVal.Float64()
		patientFloat, _ := b.PatientAmount.Float64()

		_ = f.SetCellValue(sheetName, fmt.Sprintf("A%d", rowIdx), fmt.Sprintf("BILL-%d", b.ID))
		_ = f.SetCellValue(sheetName, fmt.Sprintf("B%d", rowIdx), b.CreatedAt.Format("2006-01-02 15:04:05"))
		_ = f.SetCellValue(sheetName, fmt.Sprintf("C%d", rowIdx), b.PatientName)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("D%d", rowIdx), itemsStr)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("E%d", rowIdx), grossFloat)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("F%d", rowIdx), provider)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("G%d", rowIdx), claimFloat)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("H%d", rowIdx), patientFloat)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("I%d", rowIdx), method)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("J%d", rowIdx), b.Status)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("K%d", rowIdx), b.ProofOfPayment)

		rowIdx++
	}

	// Write Summary Row
	totGrossFloat, _ := totalGross.Float64()
	totBPJSFloat, _ := totalBPJS.Float64()
	totPatientFloat, _ := totalPatient.Float64()

	_ = f.SetCellValue(sheetName, fmt.Sprintf("A%d", rowIdx), "TOTAL KESELURUHAN")
	_ = f.SetCellValue(sheetName, fmt.Sprintf("D%d", rowIdx), fmt.Sprintf("Total %d Transaksi Billing", len(billings)))
	_ = f.SetCellValue(sheetName, fmt.Sprintf("E%d", rowIdx), totGrossFloat)
	_ = f.SetCellValue(sheetName, fmt.Sprintf("G%d", rowIdx), totBPJSFloat)
	_ = f.SetCellValue(sheetName, fmt.Sprintf("H%d", rowIdx), totPatientFloat)

	_ = f.SetCellStyle(sheetName, fmt.Sprintf("A%d", rowIdx), fmt.Sprintf("K%d", rowIdx), totalStyle)

	// Set Column Widths for clean layout
	colWidths := map[string]float64{
		"A": 14, "B": 20, "C": 22, "D": 45, "E": 20,
		"F": 18, "G": 22, "H": 22, "I": 18, "J": 12, "K": 18,
	}
	for col, width := range colWidths {
		_ = f.SetColWidth(sheetName, col, col, width)
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
