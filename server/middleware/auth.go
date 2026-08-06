package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			tokenQuery := ctx.Query("token")
			if tokenQuery != "" {
				authHeader = "Bearer " + tokenQuery
			}
		}
		if authHeader == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			ctx.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString,func(t *jwt.Token) (any, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Token"})
			ctx.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if ok {
			ctx.Set("user_id",uint(claims["user_id"].(float64)))
			ctx.Set("role", claims["role"])
			ctx.Next()
		} else {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Token"})
			ctx.Abort()
			return
		}
	}
}

func RequireRole (allowedRoles...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		userRole := ctx.GetString("role")
		if userRole == "" {
			ctx.JSON(http.StatusForbidden, gin.H{
				"error":"Akses Ditolak Role tidak ditemukan(Forbidden)",
			})
			ctx.Abort()
			return 
		}

		for _, role := range allowedRoles {
			if userRole == role {
				ctx.Next()
				return 
			}
		}

		ctx.JSON(http.StatusForbidden, gin.H{
			"error": "Akses Ditolak Anda tidak Punya Wewenang(Forbidden)",
		})
		ctx.Abort()
	}
}