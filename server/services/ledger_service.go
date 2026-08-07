package services

import (
	"errors"
	"server/config"
	"server/models"
	"server/utils"
)

func GetPaymentLedgers(search, entryTypeFilter string, page, limit int) ([]models.PaymentLedger, utils.Pagination, error) {
	var ledgers []models.PaymentLedger
	var totalRows int64

	query := config.DB.Model(&models.PaymentLedger{})
	if search != "" {
		query = query.Where("description ILIKE ?", "%"+search+"%")
	}
	if entryTypeFilter != "" {
		query = query.Where("entry_type ILIKE ?", entryTypeFilter)
	}

	if err := query.Count(&totalRows).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("id desc").Find(&ledgers).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	pagination := utils.CalculatePagination(totalRows, page, limit)
	return ledgers, pagination, nil
}

func GetPaymentLedgerByID(id uint) (*models.PaymentLedger, error) {
	var ledger models.PaymentLedger
	if err := config.DB.First(&ledger, id).Error; err != nil {
		return nil, errors.New("Ledger pembayaran tidak ditemukan")
	}
	return &ledger, nil
}

func DeletePaymentLedger(id uint) error {
	var ledger models.PaymentLedger
	if err := config.DB.First(&ledger, id).Error; err != nil {
		return errors.New("Jurnal mutasi kas tidak ditemukan")
	}
	return config.DB.Delete(&ledger).Error
}
