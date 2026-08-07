package services

import (
	"math"
	"server/config"
	"server/models"
	"server/utils"

	"github.com/gin-gonic/gin"
)

type AuditLogListResponse struct {
	Data []models.AuditLog `json:"data"`
	Meta utils.Pagination  `json:"meta"`
}

func RecordAuditLog(userID uint, username, role, action, resource, details, ip string) {
	go func() {
		log := models.AuditLog{
			UserID:    userID,
			Username:  username,
			Role:      role,
			Action:    action,
			Resource:  resource,
			Details:   details,
			IPAddress: ip,
		}
		config.DB.Create(&log)
	}()
}

// RecordFromContext automatically extracts UserID, Username, Role, and IPAddress from Gin Context
func RecordFromContext(c *gin.Context, action, resource, details string) {
	if c == nil {
		return
	}
	userIDVal, _ := c.Get("user_id")
	userID, _ := userIDVal.(uint)
	role := c.GetString("role")
	username := c.GetString("username")

	if username == "" && userID > 0 {
		var user models.User
		if err := config.DB.Select("username").First(&user, userID).Error; err == nil {
			username = user.Username
		}
	}

	ip := c.ClientIP()
	RecordAuditLog(userID, username, role, action, resource, details, ip)
}

func GetAllAuditLogs(search, action string, page, limit int) (*AuditLogListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit
	query := config.DB.Model(&models.AuditLog{})

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("username ILIKE ? OR action ILIKE ? OR resource ILIKE ? OR details ILIKE ?", s, s, s, s)
	}

	if action != "" {
		query = query.Where("action = ?", action)
	}

	var totalRows int64
	if err := query.Count(&totalRows).Error; err != nil {
		return nil, err
	}

	var logs []models.AuditLog
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(totalRows) / float64(limit)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &AuditLogListResponse{
		Data: logs,
		Meta: utils.Pagination{
			Page:       page,
			Limit:      limit,
			TotalRows:  totalRows,
			TotalPages: totalPages,
		},
	}, nil
}
