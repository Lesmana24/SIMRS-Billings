package main

import (
	"flag"
	"fmt"
	"os"
	"server/config"
	"server/route"
	"server/seeders"
)

func main() {
	seedFlag := flag.Bool("seed", false, "Jalankan database seeder")
	flag.Parse()

	config.ConnectDB()

	if *seedFlag || os.Getenv("SEED") == "true" {
		fmt.Println("Memulai proses seeding database...")
		seeders.Seed(config.DB)
		fmt.Println("Seeding database selesai.")
	}

	r := route.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}