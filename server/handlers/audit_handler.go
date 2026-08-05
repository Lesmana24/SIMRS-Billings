package handlers

import (
	"net/http"
	"server/services"
	"server/utils"

	"github.com/gin-gonic/gin"
)

func GetAuditLogs(c *gin.Context) {
	page, limit, search := utils.GetPaginationParams(c)
	actionFilter := c.Query("action")

	res, err := services.GetAllAuditLogs(search, actionFilter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil log aktivitas pengguna"})
		return
	}

	c.JSON(http.StatusOK, res)
}
