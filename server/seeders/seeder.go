package seeders

import (
	"fmt"
	"log"
	"server/models"
	"server/utils"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) {
	fmt.Println("=== Seeding Users ===")
	SeedUsers(db)

	fmt.Println("=== Seeding Tarifs ===")
	SeedTarifs(db)
}

func SeedUsers(db *gorm.DB) {
	users := []models.User{
		{
			Username: "admin",
			Role:     "admin",
		},
		{
			Username: "staff",
			Role:     "staff",
		},
		{
			Username: "pasien1",
			Role:     "pasien",
		},
		{
			Username: "pasien2",
			Role:     "pasien",
		},
	}

	for _, u := range users {
		var existing models.User
		if err := db.Where("username = ?", u.Username).First(&existing).Error; err != nil {
			hashed, err := utils.HashPassword("password123")
			if err != nil {
				log.Printf("Gagal hash password untuk user %s: %v", u.Username, err)
				continue
			}
			u.Password = hashed
			if err := db.Create(&u).Error; err != nil {
				log.Printf("Gagal seeding user %s: %v", u.Username, err)
			} else {
				fmt.Printf("Seeded user: %s (role: %s)\n", u.Username, u.Role)
			}
		} else {
			fmt.Printf("User already exists: %s\n", u.Username)
		}
	}
}

func SeedTarifs(db *gorm.DB) {
	tarifs := []models.Tarif{
		{
			ActionName: "Konsultasi Dokter Spesialis",
			Amount:     decimal.NewFromInt(150000),
		},
		{
			ActionName: "Konsultasi Dokter Umum",
			Amount:     decimal.NewFromInt(50000),
		},
		{
			ActionName: "Pemeriksaan Laboratorium Darah Lengkap",
			Amount:     decimal.NewFromInt(120000),
		},
		{
			ActionName: "Foto Rontgen Thorax",
			Amount:     decimal.NewFromInt(200000),
		},
		{
			ActionName: "Rawat Inap Kelas 1 / Hari",
			Amount:     decimal.NewFromInt(500000),
		},
		{
			ActionName: "Obat Resep Standar",
			Amount:     decimal.NewFromInt(75000),
		},
		{
			ActionName: "Tindakan UGD / EKG",
			Amount:     decimal.NewFromInt(100000),
		},
	}

	for _, t := range tarifs {
		var existing models.Tarif
		if err := db.Where("action_name = ?", t.ActionName).First(&existing).Error; err != nil {
			if err := db.Create(&t).Error; err != nil {
				log.Printf("Gagal seeding tarif %s: %v", t.ActionName, err)
			} else {
				fmt.Printf("Seeded tarif: %s - Rp %s\n", t.ActionName, t.Amount.String())
			}
		} else {
			fmt.Printf("Tarif already exists: %s\n", t.ActionName)
		}
	}
}
