package services

import (
	"errors"
	"server/config"
	"server/models"
	"server/utils"
)

type CreateUserRequest struct {
	Username     string `json:"username" binding:"required"`
	Password     string `json:"password" binding:"required"`
	Role         string `json:"role" binding:"required"`
	TwoFactorPIN string `json:"2fa_pin"`
}

type UpdateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func CreateUser(req *CreateUserRequest) (*models.User, error) {
	var existing models.User
	if err := config.DB.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		return nil, errors.New("Username sudah terdaftar pada sistem")
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("Gagal meng-hash password pengguna")
	}

	pin := req.TwoFactorPIN
	if pin == "" {
		pin = "123456"
	}

	user := models.User{
		Username:     req.Username,
		Password:     hashedPassword,
		Role:         req.Role,
		TwoFactorPIN: pin,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUsers(search, roleFilter string, page, limit int) ([]models.User, utils.Pagination, error) {
	var users []models.User
	var totalRows int64

	query := config.DB.Model(&models.User{})
	if search != "" {
		query = query.Where("username ILIKE ?", "%"+search+"%")
	}
	if roleFilter != "" {
		query = query.Where("role = ?", roleFilter)
	}

	if err := query.Count(&totalRows).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("id desc").Find(&users).Error; err != nil {
		return nil, utils.Pagination{}, err
	}

	pagination := utils.CalculatePagination(totalRows, page, limit)
	return users, pagination, nil
}

func GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		return nil, errors.New("User tidak ditemukan")
	}
	return &user, nil
}

func UpdateUser(id uint, req *UpdateUserRequest) (*models.User, error) {
	user, err := GetUserByID(id)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Username != "" {
		updates["username"] = req.Username
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}
	if req.Password != "" {
		hashed, err := utils.HashPassword(req.Password)
		if err != nil {
			return nil, errors.New("Gagal meng-hash password baru")
		}
		updates["password"] = hashed
	}

	if len(updates) > 0 {
		if err := config.DB.Model(user).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return user, nil
}

func DeleteUser(id uint) error {
	user, err := GetUserByID(id)
	if err != nil {
		return err
	}
	return config.DB.Delete(user).Error
}
