package utils

import (
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password),14)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func ComparePassword(password string, hash []byte) error {
	return bcrypt.CompareHashAndPassword(hash,[]byte(password))
}