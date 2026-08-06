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
	TwoFactorPIN string `json:"two_factor_pin"`
	PIN          string `json:"pin"`
}

type UpdateUserRequest struct {
	Username     string `json:"username"`
	Password     string `json:"password"`
	Role         string `json:"role"`
	FullName     string `json:"full_name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Address      string `json:"address"`
	NIK          string `json:"nik"`
	TwoFactorPIN string `json:"two_factor_pin"`
	PIN          string `json:"pin"`
}

type UpdateProfileRequest struct {
	FullName        string `json:"full_name"`
	Email           string `json:"email"`
	Phone           string `json:"phone"`
	Address         string `json:"address"`
	NIK             string `json:"nik"`
	NewPassword     string `json:"new_password"`
	ConfirmPassword string `json:"confirm_password"`
	TwoFactorPIN    string `json:"two_factor_pin"`
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
		pin = req.PIN
	}
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
		query = query.Where("username ILIKE ? OR full_name ILIKE ?", "%"+search+"%", "%"+search+"%")
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
	if req.FullName != "" {
		updates["full_name"] = req.FullName
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Address != "" {
		updates["address"] = req.Address
	}
	if req.NIK != "" {
		updates["nik"] = req.NIK
	}
	if req.Password != "" {
		hashed, err := utils.HashPassword(req.Password)
		if err != nil {
			return nil, errors.New("Gagal meng-hash password baru")
		}
		updates["password"] = hashed
	}

	pinVal := req.TwoFactorPIN
	if pinVal == "" {
		pinVal = req.PIN
	}
	if pinVal != "" {
		if len(pinVal) < 4 || len(pinVal) > 6 {
			return nil, errors.New("Kode 2FA PIN harus 4-6 digit angka")
		}
		updates["two_factor_pin"] = pinVal
	}

	if len(updates) > 0 {
		if err := config.DB.Model(user).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	return user, nil
}

func UpdateProfile(id uint, req *UpdateProfileRequest) (*models.User, error) {
	user, err := GetUserByID(id)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"full_name": req.FullName,
		"email":     req.Email,
		"phone":     req.Phone,
		"address":   req.Address,
		"nik":       req.NIK,
	}

	if req.NewPassword != "" {
		if req.ConfirmPassword != "" && req.NewPassword != req.ConfirmPassword {
			return nil, errors.New("Konfirmasi password baru tidak cocok (tulis ulang password berbeda)")
		}
		if len(req.NewPassword) < 6 {
			return nil, errors.New("Password baru minimal harus 6 karakter")
		}
		hashed, err := utils.HashPassword(req.NewPassword)
		if err != nil {
			return nil, errors.New("Gagal meng-hash password baru")
		}
		updates["password"] = hashed
	}

	if req.TwoFactorPIN != "" {
		if len(req.TwoFactorPIN) < 4 || len(req.TwoFactorPIN) > 6 {
			return nil, errors.New("Kode 2FA PIN harus 4-6 digit angka")
		}
		updates["two_factor_pin"] = req.TwoFactorPIN
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
