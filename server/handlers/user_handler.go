package handlers

import (
	"fmt"
	"net/http"
	"server/services"
	"server/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateUser(c *gin.Context) {
	var req services.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := services.CreateUser(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	services.RecordFromContext(
		c,
		"CREATE_USER",
		fmt.Sprintf("User #%d", user.ID),
		fmt.Sprintf("Admin membuat akun baru '%s' dengan role '%s'", user.Username, user.Role),
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Pengguna baru berhasil dibuat oleh Admin",
		"data":    user,
	})
}

func GetUsers(c *gin.Context) {
	page, limit, search := utils.GetPaginationParams(c)
	roleFilter := c.Query("role")

	users, meta, err := services.GetUsers(search, roleFilter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": users,
		"meta": meta,
	})
}

func GetUserByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	user, err := services.GetUserByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": user})
}

func UpdateUser(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req services.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := services.UpdateUser(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	services.RecordFromContext(
		c,
		"UPDATE_USER",
		fmt.Sprintf("User #%d", user.ID),
		fmt.Sprintf("Admin memperbarui data akun '%s' (Role: %s)", user.Username, user.Role),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "User berhasil diperbarui",
		"data":    user,
	})
}

func DeleteUser(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	existing, _ := services.GetUserByID(uint(id))
	targetUsername := "User"
	if existing != nil {
		targetUsername = existing.Username
	}

	if err := services.DeleteUser(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	services.RecordFromContext(
		c,
		"DELETE_USER",
		fmt.Sprintf("User #%d", id),
		fmt.Sprintf("Admin menghapus akun '%s'", targetUsername),
	)

	c.JSON(http.StatusOK, gin.H{"message": "User berhasil dihapus"})
}

func GetMyProfile(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID, _ := userIDVal.(uint)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi pengguna tidak valid"})
		return
	}

	user, err := services.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func UpdateMyProfile(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID, _ := userIDVal.(uint)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi pengguna tidak valid"})
		return
	}

	var req services.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := services.UpdateProfile(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	services.RecordFromContext(
		c,
		"UPDATE_PROFILE",
		fmt.Sprintf("User #%d", user.ID),
		fmt.Sprintf("Pengguna '%s' memperbarui informasi profil diri", user.Username),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Profil pengguna berhasil diperbarui!",
		"data":    user,
	})
}
