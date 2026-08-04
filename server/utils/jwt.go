package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userID uint, username, role string) (string, error) {
	claim := jwt.MapClaims{
		"user_id": userID,
		"username": username,
		"role": role,
		"exp" : time.Now().Add(time.Hour*24).Unix(),
	}
	token:= jwt.NewWithClaims(jwt.SigningMethodHS256, claim)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))

}