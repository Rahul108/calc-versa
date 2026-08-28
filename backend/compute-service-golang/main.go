package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/Knetic/govaluate"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const CorrelationIDHeader = "x-correlation-id"

type RotationalFileWriter struct {
	mu          sync.Mutex
	logsDir     string
	prefix      string
	currentDate string
	currentFile *os.File
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

type FormulaRule struct {
	TargetOutputID string `json:"targetOutputId"`
	Expression     string `json:"expression"`
}

type FormulaConfig struct {
	Engine string        `json:"engine"`
	Rules  []FormulaRule `json:"rules"`
}

type EvaluateRequest struct {
	Payload       map[string]interface{} `json:"payload"`
	FormulaConfig FormulaConfig          `json:"formulaConfig"`
}

func main() {
	logsDir := filepath.Join(".", "logs")
	appWriter := NewRotationalFileWriter(logsDir, "app")
	errorWriter := NewRotationalFileWriter(logsDir, "error")

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	app := fiber.New(fiber.Config{
		AppName: "CalcVersa Compute Service (Go)",
	})

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

		os.Stdout.Write(jsonLine)
		appWriter.Write(jsonLine)

		if statusCode >= 400 || err != nil {
			errorWriter.Write(jsonLine)
		}

		return err
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":        "ok",
			"service":       "compute-service-golang",
			"correlationId": c.Locals("correlation_id"),
			"timestamp":     time.Now().Format(time.RFC3339),
		})
	})

	// Real-Time Dynamic Formula Evaluation Engine Endpoint
	app.Post("/evaluate", func(c *fiber.Ctx) error {
		start := time.Now()
		var req EvaluateRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"statusCode": 400,
				"error":      "BadRequest",
				"message":    "Invalid evaluation payload format",
			})
		}

		parameters := make(map[string]interface{})
		for k, v := range req.Payload {
			parameters[k] = v
		}

		results := make(map[string]interface{})

		for _, rule := range req.FormulaConfig.Rules {
			if rule.Expression == "" || rule.TargetOutputID == "" {
				continue
			}

			// Replace ^ exponentiation operator with ** if present
			exprStr := strings.ReplaceAll(rule.Expression, "^", "**")

			expression, err := govaluate.NewEvaluableExpression(exprStr)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"statusCode": 400,
					"error":      "ExpressionError",
					"message":    fmt.Sprintf("Invalid expression format in rule '%s': %v", rule.TargetOutputID, err),
				})
			}

			val, err := expression.Evaluate(parameters)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"statusCode": 400,
					"error":      "EvaluationError",
					"message":    fmt.Sprintf("Failed to evaluate rule '%s': %v", rule.TargetOutputID, err),
				})
			}

			results[rule.TargetOutputID] = val
			parameters[rule.TargetOutputID] = val // Make available to subsequent rules
		}

		duration := time.Since(start)

		return c.JSON(fiber.Map{
			"status":        "success",
			"results":        results,
			"duration_ms":    float64(duration.Microseconds()) / 1000.0,
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
