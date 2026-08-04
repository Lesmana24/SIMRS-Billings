package config

import (
	"fmt"
	"os"

	"server/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("ENV Tidak Ditemukan")
	}

	host:= os.Getenv("DB_HOST")
	user:= os.Getenv("DB_USER")
	pass:= os.Getenv("DB_PASSWORD")
	port:= os.Getenv("DB_PORT")
	dbname:= os.Getenv("DB_NAME")

	dsn:= fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta", host, user, pass, dbname, port)
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Error Connect")
	}

	err = database.AutoMigrate(
		&models.User{},
		&models.Tarif{},
		&models.MedicalBilling{},
		&models.BillingItem{},
		&models.IdempotencyLog{},
		&models.PaymentLedger{},
	)
	DB = database
	fmt.Println("Connected to Database")
}
