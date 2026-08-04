package utils

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalRows  int64 `json:"total_rows"`
	TotalPages int   `json:"total_pages"`
}

func GetPaginationParams(c *gin.Context) (page int, limit int, search string) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err = strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 10
	} else if limit > 100 {
		limit = 100
	}

	search = c.Query("search")
	return page, limit, search
}

func CalculatePagination(totalRows int64, page, limit int) Pagination {
	totalPages := int(math.Ceil(float64(totalRows) / float64(limit)))
	if totalPages == 0 && totalRows == 0 {
		totalPages = 0
	} else if totalPages == 0 {
		totalPages = 1
	}
	return Pagination{
		Page:       page,
		Limit:      limit,
		TotalRows:  totalRows,
		TotalPages: totalPages,
	}
}
