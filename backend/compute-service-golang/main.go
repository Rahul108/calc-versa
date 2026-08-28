package main

import (
	"log/slog"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const CorrelationIDHeader = "x-correlation-id"

func main() {
	// Initialize structured JSON logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	app := fiber.New(fiber.Config{
		AppName: "CalcVersa Compute Service (Go)",
	})

	// Correlation ID & Structured Logging Middleware
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

		slog.Info("HTTP Request",
			slog.String("service", "compute-service-golang"),
			slog.String("correlation_id", correlationID),
			slog.String("method", c.Method()),
			slog.String("url", c.OriginalURL()),
			slog.String("origin_ip", c.IP()),
			slog.String("user_agent", c.Get("User-Agent")),
			slog.Int("status_code", statusCode),
			slog.Float64("duration_ms", float64(duration.Microseconds())/1000.0),
		)

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
			slog.Error("Failed to parse request body",
				slog.String("service", "compute-service-golang"),
				slog.String("correlation_id", c.Locals("correlation_id").(string)),
				slog.String("error", err.Error()),
			)
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
			"result":        42.0, // Mock calculated result
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
