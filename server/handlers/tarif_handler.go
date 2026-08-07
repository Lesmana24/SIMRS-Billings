package handlers

import (
	"fmt"
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

	services.RecordFromContext(
		c,
		"CREATE_TARIF",
		fmt.Sprintf("Tarif #%d", tarif.ID),
		fmt.Sprintf("Menambahkan master tarif baru '%s' (Rp %s)", tarif.ActionName, tarif.Amount.StringFixed(0)),
	)

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

	services.RecordFromContext(
		c,
		"UPDATE_TARIF",
		fmt.Sprintf("Tarif #%d", tarif.ID),
		fmt.Sprintf("Mengubah master tarif '%s' (Nominal Baru: Rp %s)", tarif.ActionName, tarif.Amount.StringFixed(0)),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Tarif berhasil diperbarui",
		"data":    tarif,
	})
}

func DeleteTarif(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	existing, _ := services.GetTarifByID(uint(id))
	actionName := "Tarif"
	if existing != nil {
		actionName = existing.ActionName
	}

	if err := services.DeleteTarif(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	services.RecordFromContext(
		c,
		"DELETE_TARIF",
		fmt.Sprintf("Tarif #%d", id),
		fmt.Sprintf("Menghapus master tarif '%s'", actionName),
	)

	c.JSON(http.StatusOK, gin.H{"message": "Tarif berhasil dihapus"})
}
