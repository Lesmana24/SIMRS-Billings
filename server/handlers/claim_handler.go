package handlers

import (
	"fmt"
	"net/http"
	"server/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetBPJSClaims(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	search := c.Query("search")
	providerType := c.Query("provider_type")

	billings, meta, err := services.GetBPJSClaims(page, limit, status, search, providerType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": billings,
		"meta": meta,
	})
}

func UpdateClaimStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	var req services.UpdateClaimStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status klaim wajib diisi"})
		return
	}

	billing, err := services.UpdateClaimStatus(uint(id), req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Record Audit Log
	services.RecordFromContext(
		c,
		"UPDATE_CLAIM_STATUS",
		fmt.Sprintf("#BILL-%d", billing.ID),
		fmt.Sprintf("Memperbarui status klaim BPJS pasien %s menjadi [%s] (Nominal: Rp %s)", billing.PatientName, req.Status, billing.BPJSAmount.StringFixed(0)),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Status klaim BPJS berhasil diperbarui",
		"data":    billing,
	})
}

func GetClaimSummary(c *gin.Context) {
	providerType := c.Query("provider_type")
	summary, err := services.GetClaimSummary(providerType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
	})
}
