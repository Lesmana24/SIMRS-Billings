package models

import (
	"time"

	"gorm.io/gorm"
)

type IdempotencyLog struct {
	gorm.Model
	IdempotencyKey	string		`gorm:"uniqueindex;not null" json:"idempotency_key"`
	ResponseBody	string		`gorm:"type:text" json:"response_body,omitempty"`
	CreatedAt		time.Time	`json:"created_at"`
}