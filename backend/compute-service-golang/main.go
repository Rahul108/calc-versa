package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
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

func ReplaceExponentiationOperators(expr string) string {
	return strings.ReplaceAll(expr, "^", "**")
}

// maxCachedExpressions bounds the compiled-expression cache. Formulas come from
// tool configs, so the working set is small; past the bound we just compile per call.
const maxCachedExpressions = 10000

var (
	expressionCache     sync.Map // normalized expression string -> *govaluate.EvaluableExpression
	expressionCacheSize int64
	expressionCacheMu   sync.Mutex
)

// compileExpression returns a cached compiled expression, compiling it on first use.
// Compiled govaluate expressions are immutable and safe to evaluate concurrently.
func compileExpression(exprStr string) (*govaluate.EvaluableExpression, error) {
	if cached, ok := expressionCache.Load(exprStr); ok {
		return cached.(*govaluate.EvaluableExpression), nil
	}

	expression, err := govaluate.NewEvaluableExpression(exprStr)
	if err != nil {
		return nil, err
	}

	expressionCacheMu.Lock()
	if expressionCacheSize < maxCachedExpressions {
		if _, loaded := expressionCache.LoadOrStore(exprStr, expression); !loaded {
			expressionCacheSize++
		}
	}
	expressionCacheMu.Unlock()
	return expression, nil
}

// isNonFinite reports whether a rule result cannot be represented in JSON
// (e.g. division by zero yields +Inf, 0/0 yields NaN).
func isNonFinite(val interface{}) bool {
	f, ok := val.(float64)
	return ok && (math.IsInf(f, 0) || math.IsNaN(f))
}

func EvaluateFormulaRules(req EvaluateRequest) (map[string]interface{}, error) {
	parameters := make(map[string]interface{})
	for k, v := range req.Payload {
		parameters[k] = v
	}

	results := make(map[string]interface{})

	for _, rule := range req.FormulaConfig.Rules {
		if rule.Expression == "" || rule.TargetOutputID == "" {
			continue
		}

		exprStr := ReplaceExponentiationOperators(rule.Expression)
		expression, err := compileExpression(exprStr)
		if err != nil {
			return nil, fmt.Errorf("invalid expression format in rule '%s': %v", rule.TargetOutputID, err)
		}

		val, err := expression.Evaluate(parameters)
		if err != nil {
			return nil, fmt.Errorf("failed to evaluate rule '%s': %v", rule.TargetOutputID, err)
		}
		if isNonFinite(val) {
			return nil, fmt.Errorf("rule '%s' produced a non-finite result (%v); check for division by zero or invalid inputs", rule.TargetOutputID, val)
		}

		results[rule.TargetOutputID] = val
		parameters[rule.TargetOutputID] = val
	}

	return results, nil
}

func SetupApp() *fiber.App {
	logsDir := filepath.Join(".", "logs")
	appWriter := NewRotationalFileWriter(logsDir, "app")
	errorWriter := NewRotationalFileWriter(logsDir, "error")

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	app := fiber.New(fiber.Config{
		AppName:      "CalcVersa Compute Service (Go)",
		BodyLimit:    1 * 1024 * 1024,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
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

	app.Post("/evaluate", func(c *fiber.Ctx) error {
		start := time.Now()
		var req EvaluateRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"statusCode":    400,
				"error":         "BadRequest",
				"message":       "Invalid evaluation payload format",
				"correlationId": c.Locals("correlation_id"),
			})
		}

		results, err := EvaluateFormulaRules(req)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"statusCode":    400,
				"error":         "EvaluationError",
				"message":       err.Error(),
				"correlationId": c.Locals("correlation_id"),
			})
		}

		duration := time.Since(start)

		return c.JSON(fiber.Map{
			"status":        "success",
			"results":       results,
			"duration_ms":   float64(duration.Microseconds()) / 1000.0,
			"service":       "compute-service-golang",
			"correlationId": c.Locals("correlation_id"),
			"timestamp":     time.Now().Format(time.RFC3339),
		})
	})

	return app
}

func main() {
	app := SetupApp()
	port := os.Getenv("PORT")
	if port == "" {
		// 8085 matches the API Gateway's default COMPUTE_SERVICE_URL for host runs;
		// docker-compose sets PORT=8080 inside the container explicitly.
		port = "8085"
	}

	slog.Info("Compute Service starting", slog.String("port", port))
	if err := app.Listen(":" + port); err != nil {
		slog.Error("Server failed to start", slog.String("error", err.Error()))
	}
}
