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
			staffOnly := authenticated.Group("")
			staffOnly.Use(middleware.RequireRole("admin", "staff"))
			{
				staffOnly.POST("/tarifs", handlers.AddTarif)
				staffOnly.POST("/billings", handlers.CreateBilling)
				staffOnly.POST("/billings/:id/pay", handlers.PayBilling)
			}

			pasienOnly := authenticated.Group("")
			pasienOnly.Use(middleware.RequireRole("pasien"))
			{
				pasienOnly.GET("/pasien/my-billings", handlers.GetMyBillings)
			}
		}
	}

	return r
}