package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const CorrelationIDHeader = "x-correlation-id"

// RotationalFileWriter handles daily rotating log files under logs/ directory
type RotationalFileWriter struct {
	mu           sync.Mutex
	logsDir      string
	prefix       string // "app" or "error"
	currentDate  string
	currentFile  *os.File
}

func NewRotationalFileWriter(logsDir, prefix string) *RotationalFileWriter {
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create logs dir: %v\n", err)
	}
	return &RotationalFileWriter{
		logsDir: logsDir,
		prefix:  prefix,
	}
}

func (w *RotationalFileWriter) Write(p []byte) (n int, err error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	today := time.Now().Format("2006-01-02")
	if w.currentFile == nil || w.currentDate != today {
		if w.currentFile != nil {
			w.currentFile.Close()
		}
		filename := filepath.Join(w.logsDir, fmt.Sprintf("%s-%s.log", w.prefix, today))
		f, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			return 0, err
		}
		w.currentFile = f
		w.currentDate = today
	}

	return w.currentFile.Write(p)
}

func main() {
	logsDir := filepath.Join(".", "logs")
	appWriter := NewRotationalFileWriter(logsDir, "app")
	errorWriter := NewRotationalFileWriter(logsDir, "error")

	// Multi-writer JSON handler for console and rotational file logs
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	app := fiber.New(fiber.Config{
		AppName: "CalcVersa Compute Service (Go)",
	})

	// Correlation ID & Rotational Logging Middleware
	app.Use(func(c *fiber.Ctx) error {
		start := time.Now()

		correlationID := c.Get(CorrelationIDHeader)
		if correlationID == "" {
			correlationID = c.Get("x-request-id")
		}
		if correlationID == "" {
			correlationID = uuid.New().String()
		}

		c.Set(CorrelationIDHeader, correlationID)
		c.Locals("correlation_id", correlationID)

		err := c.Next()

		duration := time.Since(start)
		statusCode := c.Response().StatusCode()

		logObj := map[string]interface{}{
			"timestamp":      time.Now().Format(time.RFC3339),
			"level":          "INFO",
			"service":        "compute-service-golang",
			"correlation_id": correlationID,
			"request": map[string]interface{}{
				"method":     c.Method(),
				"url":        c.OriginalURL(),
				"origin_ip":  c.IP(),
				"user_agent": c.Get("User-Agent"),
			},
			"duration_ms": float64(duration.Microseconds()) / 1000.0,
			"status_code": statusCode,
			"message":     fmt.Sprintf("%s %s %d - %.2fms", c.Method(), c.OriginalURL(), statusCode, float64(duration.Microseconds())/1000.0),
		}

		if err != nil || statusCode >= 400 {
			logObj["level"] = "ERROR"
			if err != nil {
				logObj["error"] = map[string]interface{}{"message": err.Error()}
			}
		}

		jsonBytes, _ := json.Marshal(logObj)
		jsonLine := append(jsonBytes, '\n')

		// Write to app-<date>.log and stdout
		os.Stdout.Write(jsonLine)
		appWriter.Write(jsonLine)

		// Write to error-<date>.log if status >= 400 or error exists
		if statusCode >= 400 || err != nil {
			errorWriter.Write(jsonLine)
		}

		return err
	})

	// Health Check Route
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":        "ok",
			"service":       "compute-service-golang",
			"correlationId": c.Locals("correlation_id"),
			"timestamp":     time.Now().Format(time.RFC3339),
		})
	})

	// Sample Formula Calculation Route
	app.Post("/compute/eval", func(c *fiber.Ctx) error {
		var req struct {
			Expression string                 `json:"expression"`
			Inputs     map[string]interface{} `json:"inputs"`
		}

		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"statusCode":    400,
				"error":         "BadRequest",
				"message":       "Invalid calculation payload",
				"service":       "compute-service-golang",
				"correlationId": c.Locals("correlation_id"),
				"timestamp":     time.Now().Format(time.RFC3339),
			})
		}

		return c.JSON(fiber.Map{
			"status":        "success",
			"expression":    req.Expression,
			"result":        42.0,
			"service":       "compute-service-golang",
			"correlationId": c.Locals("correlation_id"),
			"timestamp":     time.Now().Format(time.RFC3339),
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	slog.Info("Compute Service starting", slog.String("port", port))
	if err := app.Listen(":" + port); err != nil {
		slog.Error("Server failed to start", slog.String("error", err.Error()))
	}
}
