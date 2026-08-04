package main

import (
	"fmt"
	"server/config"
	"server/seeders"
)

func main() {
	config.ConnectDB()
	fmt.Println("Running standalone database seeder...")
	seeders.Seed(config.DB)
	fmt.Println("Seeding completed!")
}
