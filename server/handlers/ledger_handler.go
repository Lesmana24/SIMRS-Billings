package handlers

import (
	"net/http"
	"server/services"
	"server/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetPaymentLedgers(c *gin.Context) {
	page, limit, search := utils.GetPaginationParams(c)
	entryType := c.Query("entry_type")

	ledgers, meta, err := services.GetPaymentLedgers(search, entryType, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data ledger pembayaran"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": ledgers,
		"meta": meta,
	})
}

func GetPaymentLedgerByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	ledger, err := services.GetPaymentLedgerByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": ledger})
}
