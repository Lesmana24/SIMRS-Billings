package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

type ImageKitUploadResponse struct {
	FileID string `json:"fileId"`
	Name   string `json:"name"`
	URL    string `json:"url"`
}

// UploadToImageKit uploads a file stream to ImageKit API using server private key
func UploadToImageKit(fileReader io.Reader, fileName string) (string, error) {
	privateKey := os.Getenv("IMAGEKIT_PRIVATE_KEY")
	if privateKey == "" {
		privateKey = "private_gfPQyiB0l8vfVEQypYp5QYPpyJ4="
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		return "", fmt.Errorf("Gagal membuat form file: %w", err)
	}
	if _, err := io.Copy(part, fileReader); err != nil {
		return "", fmt.Errorf("Gagal membaca file: %w", err)
	}

	_ = writer.WriteField("fileName", fileName)
	_ = writer.WriteField("useUniqueFileName", "true")
	writer.Close()

	req, err := http.NewRequest("POST", "https://upload.imagekit.io/api/v1/files/upload", body)
	if err != nil {
		return "", fmt.Errorf("Gagal membuat HTTP request ImageKit: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.SetBasicAuth(privateKey, "")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Gagal mengirim request ke ImageKit Cloud: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("Gagal membaca response ImageKit: %w", err)
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("Upload ImageKit Gagal (status %d): %s", resp.StatusCode, string(respBody))
	}

	var ikResp ImageKitUploadResponse
	if err := json.Unmarshal(respBody, &ikResp); err != nil {
		return "", fmt.Errorf("Gagal parse JSON ImageKit: %w", err)
	}

	return ikResp.URL, nil
}
