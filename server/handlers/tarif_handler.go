package handlers

import (
	"net/http"
	"server/config"
	"server/models"
	"server/services"
	"server/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

func AddTarif(c *gin.Context) {
	var tarif models.Tarif
	if err := c.ShouldBindJSON(&tarif); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Create(&tarif).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menambahkan tarif"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": tarif})
}

func GetTarifs(c *gin.Context) {
	page, limit, search := utils.GetPaginationParams(c)
	tarifs, meta, err := services.GetTarifs(search, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data tarif"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": tarifs,
		"meta": meta,
	})
}

func GetTarifByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	tarif, err := services.GetTarifByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tarif})
}

func UpdateTarif(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req services.UpdateTarifRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tarif, err := services.UpdateTarif(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Tarif berhasil diperbarui",
		"data":    tarif,
	})
}

func DeleteTarif(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := services.DeleteTarif(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tarif berhasil dihapus"})
}
