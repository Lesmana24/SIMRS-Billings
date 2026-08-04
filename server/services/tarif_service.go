package services

import (
	"errors"
	"server/config"
	"server/models"
	"server/utils"

	"github.com/shopspring/decimal"
)

type UpdateTarifRequest struct {
	ActionName string          `json:"action_name"`
	Amount     decimal.Decimal `json:"amount"`
}

func GetTarifs(search string, page, limit int) ([]models.Tarif, utils.Pagination, error) {
	var tarifs []models.Tarif
	var totalRows int64

	query := config.DB.Model(&models.Tarif{})
	if search != "" {
		query = query.Where("action_name ILIKE ?", "%"+search+"%")
	}

	if err := query.Count(&totalRows).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("id desc").Find(&tarifs).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	pagination := utils.CalculatePagination(totalRows, page, limit)
	return tarifs, pagination, nil
}

func GetTarifByID(id uint) (*models.Tarif, error) {
	var tarif models.Tarif
	if err := config.DB.First(&tarif, id).Error; err != nil {
		return nil, errors.New("Tarif tidak ditemukan")
	}
	return &tarif, nil
}

func UpdateTarif(id uint, req *UpdateTarifRequest) (*models.Tarif, error) {
	tarif, err := GetTarifByID(id)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.ActionName != "" {
		updates["action_name"] = req.ActionName
	}
	if !req.Amount.IsZero() {
		updates["amount"] = req.Amount
	}

	if len(updates) > 0 {
		if err := config.DB.Model(tarif).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return tarif, nil
}

func DeleteTarif(id uint) error {
	tarif, err := GetTarifByID(id)
	if err != nil {
		return err
	}
	return config.DB.Delete(tarif).Error
}
