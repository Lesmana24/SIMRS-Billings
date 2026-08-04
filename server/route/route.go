package route

import (
	"server/handlers"
	"server/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	api := r.Group("/api/v1")
	{
		// Publik
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/login", handlers.Login)

		// Privat
		authenticated := api.Group("")
		authenticated.Use(middleware.AuthMiddleware())
		{
			// Staff & Admin Routes
			staffOnly := authenticated.Group("")
			staffOnly.Use(middleware.RequireRole("admin", "staff"))
			{
				// Tarifs
				staffOnly.POST("/tarifs", handlers.AddTarif)
				staffOnly.GET("/tarifs", handlers.GetTarifs)
				staffOnly.GET("/tarifs/:id", handlers.GetTarifByID)
				staffOnly.PUT("/tarifs/:id", handlers.UpdateTarif)
				staffOnly.DELETE("/tarifs/:id", handlers.DeleteTarif)

				// Billings
				staffOnly.POST("/billings", handlers.CreateBilling)
				staffOnly.GET("/billings", handlers.GetAllBillings)
				staffOnly.GET("/billings/:id", handlers.GetBillingByID)
				staffOnly.PUT("/billings/:id", handlers.UpdateBilling)
				staffOnly.DELETE("/billings/:id", handlers.DeleteBilling)
				staffOnly.POST("/billings/:id/pay", handlers.PayBilling)

				// Users
				staffOnly.GET("/users", handlers.GetUsers)
				staffOnly.GET("/users/:id", handlers.GetUserByID)
				staffOnly.PUT("/users/:id", handlers.UpdateUser)
				staffOnly.DELETE("/users/:id", handlers.DeleteUser)

				// Payment Ledgers
				staffOnly.GET("/ledgers", handlers.GetPaymentLedgers)
				staffOnly.GET("/ledgers/:id", handlers.GetPaymentLedgerByID)
			}

			// Pasien Routes
			pasienOnly := authenticated.Group("")
			pasienOnly.Use(middleware.RequireRole("pasien"))
			{
				pasienOnly.GET("/pasien/my-billings", handlers.GetMyBillings)
				pasienOnly.GET("/pasien/my-billings/:id", handlers.GetMyBillingByID)
			}
		}
	}

	return r
}