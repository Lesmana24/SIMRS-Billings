package handlers

import (
	"net/http"
	"server/services"
	"server/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateBilling(c *gin.Context) {
	var req services.CreateBillingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	billing, err := services.CreateBilling(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": billing,
	})
}

func PayBilling(c *gin.Context) {
	billingID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	idempotencyKey := c.GetHeader("X-Idempotency-Key")

	if idempotencyKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Header X-Idempotency-Key wajib diisi",
		})
		return
	}

	billing, err := services.ProcessPayment(uint(billingID), idempotencyKey)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pembayaran Berhasil Diproses",
		"data":    billing,
	})
}

func GetAllBillings(c *gin.Context) {
	page, limit, search := utils.GetPaginationParams(c)
	statusFilter := c.Query("status")

	billings, meta, err := services.GetAllBillings(search, statusFilter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data tagihan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": billings,
		"meta": meta,
	})
}

func GetBillingByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	billing, err := services.GetBillingByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": billing})
}

func UpdateBilling(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req services.UpdateBillingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	billing, err := services.UpdateBilling(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tagihan berhasil diperbarui",
		"data":    billing,
	})
}

func DeleteBilling(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := services.DeleteBilling(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tagihan berhasil dihapus"})
}

func GetMyBillings(c *gin.Context) {
	patientUserID := c.MustGet("user_id").(uint)
	page, limit, search := utils.GetPaginationParams(c)
	statusFilter := c.Query("status")

	billings, meta, err := services.GetPatientBillingsPaginated(patientUserID, search, statusFilter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil data tagihan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": billings,
		"meta": meta,
	})
}

func GetMyBillingByID(c *gin.Context) {
	patientUserID := c.MustGet("user_id").(uint)
	billingID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	billing, err := services.GetPatientBillingByID(patientUserID, uint(billingID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": billing,
	})
}