package handlers

import (
	"fmt"
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

// SubmitProof allows patient to upload payment proof (Status becomes WAITING_VERIFICATION)
func SubmitProof(c *gin.Context) {
	billingID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	userIDVal, exists := c.Get("user_id")
	var userID uint
	if exists {
		userID = userIDVal.(uint)
	}

	billing, err := services.GetBillingByID(uint(billingID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tagihan tidak ditemukan"})
		return
	}

	userRole := c.GetString("role")
	if userRole == "pasien" && billing.PatientUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses Ditolak: Tagihan bukan milik Anda"})
		return
	}

	file, fileHeader, err := c.Request.FormFile("proof_file")
	if err != nil || file == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Harap unggah file foto bukti transfer"})
		return
	}
	defer file.Close()

	fileName := fmt.Sprintf("bukti-BILL-%d-%s", billingID, fileHeader.Filename)
	uploadedURL, ikErr := services.UploadToImageKit(file, fileName)
	if ikErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Gagal unggah ke ImageKit: %v", ikErr),
		})
		return
	}

	updatedBilling, err := services.SubmitPaymentProof(uint(billingID), uploadedURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bukti pembayaran berhasil diunggah! Menunggu verifikasi kasir",
		"data":    updatedBilling,
	})
}

// PayBilling allows staff/admin to approve payment (Status becomes PAID & Ledger DEBIT is created)
func PayBilling(c *gin.Context) {
	billingID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	idempotencyKey := c.GetHeader("X-Idempotency-Key")

	if idempotencyKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Header X-Idempotency-Key wajib diisi",
		})
		return
	}

	var proofURL string

	file, fileHeader, err := c.Request.FormFile("proof_file")
	if err == nil && file != nil {
		defer file.Close()
		fileName := fmt.Sprintf("bukti-BILL-%d-%s", billingID, fileHeader.Filename)
		uploadedURL, ikErr := services.UploadToImageKit(file, fileName)
		if ikErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Gagal unggah ke ImageKit: %v", ikErr),
			})
			return
		}
		proofURL = uploadedURL
	} else {
		proofURL = c.PostForm("proof_of_payment")
	}

	billing, err := services.ProcessPayment(uint(billingID), idempotencyKey, proofURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pembayaran Berhasil Diproses & Dikonfirmasi",
		"data":    billing,
	})
}

// RejectBilling allows staff/admin to reject invalid payment proof (Status becomes REJECTED)
func RejectBilling(c *gin.Context) {
	billingID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	billing, err := services.RejectPayment(uint(billingID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bukti pembayaran ditolak",
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