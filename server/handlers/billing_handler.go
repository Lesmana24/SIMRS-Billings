package handlers

import (
	"net/http"
	"server/config"
	"server/models"
	"server/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

func AddTarif(c *gin.Context){
	var tarif models.Tarif
	if err:= c.ShouldBindJSON(&tarif); err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}
	config.DB.Create(&tarif)
	c.JSON(http.StatusCreated, gin.H{
		"data": tarif,
	})
}

func CreateBilling(c *gin.Context){
	var req services.CreateBillingRequest
	if err:= c.ShouldBindJSON(&req); err!=nil{
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

func PayBilling(c *gin.Context){
	billingID, _ := strconv.ParseUint(c.Param("id"), 10,32)
	idempotencyKey := c.GetHeader("X-Idempotency-Key")

	if idempotencyKey == ""{
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Header X-Idempotency-Key",
		})
		return
	}

	billing, err := services.ProcessPayment(uint(billingID), idempotencyKey)
	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Pembayaran Berhasil Diproses",
		"data": billing,
	})
}

func GetMyBillings(c *gin.Context){
	patientUserID := c.MustGet("user_id").(uint)

	billings, err := services.GetPatientBillings(patientUserID)
	if err!= nil{
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal Mengambil Tagihan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": billings,
	})
}