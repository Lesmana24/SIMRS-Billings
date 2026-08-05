package handlers

import (
	"fmt"
	"net/http"
	"server/services"
	"time"

	"github.com/gin-gonic/gin"
)

func GetAnalyticsSummary(c *gin.Context) {
	summary, err := services.GetAnalyticsSummary()
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
	csvBytes, err := services.GenerateFinancialReportCSV()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal menghasilkan laporan kas CSV: " + err.Error(),
		})
		return
	}

	fileName := fmt.Sprintf("Laporan_Kas_SIMRS_%s.csv", time.Now().Format("2006-01-02"))

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Data(http.StatusOK, "text/csv; charset=utf-8", csvBytes)
}
