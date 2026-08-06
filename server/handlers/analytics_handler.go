package handlers

import (
	"fmt"
	"net/http"
	"server/services"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetAnalyticsSummary(c *gin.Context) {
	month, _ := strconv.Atoi(c.Query("month"))
	year, _ := strconv.Atoi(c.Query("year"))

	summary, err := services.GetAnalyticsSummary(month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal menghitung data analitik keuangan: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   summary,
	})
}

func ExportLedgersReport(c *gin.Context) {
	month, _ := strconv.Atoi(c.Query("month"))
	year, _ := strconv.Atoi(c.Query("year"))
	format := c.Query("format")

	if format == "xlsx" || format == "excel" {
		excelBytes, err := services.GenerateFinancialReportExcel(month, year)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal menghasilkan laporan Excel: " + err.Error(),
			})
			return
		}

		fileName := fmt.Sprintf("Laporan_Kas_SIMRS_%d_%02d.xlsx", year, month)
		if month == 0 || year == 0 {
			fileName = fmt.Sprintf("Laporan_Kas_SIMRS_%s.xlsx", time.Now().Format("2006-01-02"))
		}

		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"; filename*=UTF-8''%s", fileName, fileName))
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Access-Control-Expose-Headers", "Content-Disposition, Content-Length")
		c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes)
		return
	}

	csvBytes, err := services.GenerateFinancialReportCSV(month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal menghasilkan laporan kas CSV: " + err.Error(),
		})
		return
	}

	fileName := fmt.Sprintf("Laporan_Kas_SIMRS_%d_%02d.csv", year, month)
	if month == 0 || year == 0 {
		fileName = fmt.Sprintf("Laporan_Kas_SIMRS_%s.csv", time.Now().Format("2006-01-02"))
	}

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"; filename*=UTF-8''%s", fileName, fileName))
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Access-Control-Expose-Headers", "Content-Disposition, Content-Length")
	c.Data(http.StatusOK, "text/csv; charset=utf-8", csvBytes)
}
