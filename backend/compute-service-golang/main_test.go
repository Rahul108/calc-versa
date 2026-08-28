package main

import (
	"bytes"
	"encoding/json"
	"math"
	"net/http/httptest"
	"testing"
)

// ---------------------------------------------------------------------------
// Unit Test 1: Mortgage Calculator Formula Evaluation
// ---------------------------------------------------------------------------
func TestEvaluateFormula_MortgageCalculator(t *testing.T) {
	req := EvaluateRequest{
		Payload: map[string]interface{}{
			"principal":   300000.0,
			"annual_rate": 6.5,
			"term_years":  30.0,
		},
		FormulaConfig: FormulaConfig{
			Engine: "standard",
			Rules: []FormulaRule{
				{
					TargetOutputID: "monthly_payment",
					Expression:     "(principal * (annual_rate / 1200)) / (1 - (1 + (annual_rate / 1200)) ** (-1 * term_years * 12))",
				},
			},
		},
	}

	results, err := EvaluateFormulaRules(req)
	if err != nil {
		t.Fatalf("Unexpected evaluation error: %v", err)
	}

	payment, ok := results["monthly_payment"].(float64)
	if !ok {
		t.Fatalf("Expected monthly_payment float64 result, got: %T", results["monthly_payment"])
	}

	expectedPayment := 1896.204
	if math.Abs(payment-expectedPayment) > 0.01 {
		t.Errorf("Mortgage calculation mismatch! Got: %.2f, Expected: %.2f", payment, expectedPayment)
	}
}

// ---------------------------------------------------------------------------
// Unit Test 2: Multi-Step Sequential Rules (Output 2 depends on Output 1)
// ---------------------------------------------------------------------------
func TestEvaluateFormula_SequentialDependentRules(t *testing.T) {
	req := EvaluateRequest{
		Payload: map[string]interface{}{
			"principal":   100000.0,
			"annual_rate": 12.0,
			"term_years":  10.0,
		},
		FormulaConfig: FormulaConfig{
			Engine: "standard",
			Rules: []FormulaRule{
				{
					TargetOutputID: "r",
					Expression:     "annual_rate / 1200",
				},
				{
					TargetOutputID: "n",
					Expression:     "term_years * 12",
				},
				{
					TargetOutputID: "monthly_payment",
					Expression:     "(principal * r) / (1 - (1 + r) ** (-1 * n))",
				},
				{
					TargetOutputID: "total_paid",
					Expression:     "monthly_payment * n",
				},
			},
		},
	}

	results, err := EvaluateFormulaRules(req)
	if err != nil {
		t.Fatalf("Unexpected evaluation error: %v", err)
	}

	rVal, _ := results["r"].(float64)
	if rVal != 0.01 {
		t.Errorf("Expected r = 0.01, got: %f", rVal)
	}

	nVal, _ := results["n"].(float64)
	if nVal != 120.0 {
		t.Errorf("Expected n = 120, got: %f", nVal)
	}

	payment, _ := results["monthly_payment"].(float64)
	expectedPayment := 1434.709
	if math.Abs(payment-expectedPayment) > 0.01 {
		t.Errorf("Sequential monthly payment mismatch! Got: %.2f, Expected: %.2f", payment, expectedPayment)
	}

	totalPaid, _ := results["total_paid"].(float64)
	expectedTotal := expectedPayment * 120
	if math.Abs(totalPaid-expectedTotal) > 1.0 {
		t.Errorf("Total paid mismatch! Got: %.2f, Expected: %.2f", totalPaid, expectedTotal)
	}
}

// ---------------------------------------------------------------------------
// Unit Test 3: Compound Interest Formula Evaluation
// ---------------------------------------------------------------------------
func TestEvaluateFormula_CompoundInterest(t *testing.T) {
	req := EvaluateRequest{
		Payload: map[string]interface{}{
			"principal": 5000.0,
			"rate":      0.05,
			"years":     5.0,
			"n":         12.0,
		},
		FormulaConfig: FormulaConfig{
			Rules: []FormulaRule{
				{
					TargetOutputID: "future_value",
					Expression:     "principal * (1 + rate / n) ** (n * years)",
				},
			},
		},
	}

	results, err := EvaluateFormulaRules(req)
	if err != nil {
		t.Fatalf("Unexpected compound interest error: %v", err)
	}

	futureValue, _ := results["future_value"].(float64)
	expectedFV := 6416.79
	if math.Abs(futureValue-expectedFV) > 0.1 {
		t.Errorf("Compound interest mismatch! Got: %.2f, Expected: %.2f", futureValue, expectedFV)
	}
}

// ---------------------------------------------------------------------------
// Unit Test 4: Exponentiation Operator Normalization (^ vs **)
// ---------------------------------------------------------------------------
func TestEvaluateFormula_OperatorNormalization(t *testing.T) {
	exprCaret := ReplaceExponentiationOperators("2 ^ 3 + 10")
	if exprCaret != "2 ** 3 + 10" {
		t.Errorf("Expected '^' to be converted to '**', got: %s", exprCaret)
	}

	req := EvaluateRequest{
		Payload: map[string]interface{}{"base": 2.0, "exp": 4.0},
		FormulaConfig: FormulaConfig{
			Rules: []FormulaRule{
				{TargetOutputID: "power", Expression: "base ^ exp"},
			},
		},
	}

	results, err := EvaluateFormulaRules(req)
	if err != nil {
		t.Fatalf("Unexpected evaluation error: %v", err)
	}

	val, _ := results["power"].(float64)
	if val != 16.0 {
		t.Errorf("Expected 2 ^ 4 = 16.0, got: %f", val)
	}
}

// ---------------------------------------------------------------------------
// Unit Test 5: Invalid Syntax Graceful Error Handling
// ---------------------------------------------------------------------------
func TestEvaluateFormula_InvalidSyntax(t *testing.T) {
	req := EvaluateRequest{
		Payload: map[string]interface{}{"x": 10.0},
		FormulaConfig: FormulaConfig{
			Rules: []FormulaRule{
				{TargetOutputID: "bad_output", Expression: "x * / + 5"},
			},
		},
	}

	_, err := EvaluateFormulaRules(req)
	if err == nil {
		t.Error("Expected error for invalid formula expression syntax, got nil")
	}
}

// ---------------------------------------------------------------------------
// Unit Test 6: HTTP Routes (/health & /evaluate) via SetupApp()
// ---------------------------------------------------------------------------
func TestHttpRoutes_HealthCheck(t *testing.T) {
	app := SetupApp()

	req := httptest.NewRequest("GET", "/health", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to send GET /health test request: %v", err)
	}

	if resp.StatusCode != 200 {
		t.Errorf("Expected HTTP 200 status for /health, got: %d", resp.StatusCode)
	}
}

func TestHttpRoutes_EvaluateEndpoint(t *testing.T) {
	app := SetupApp()

	payloadBody := EvaluateRequest{
		Payload: map[string]interface{}{"width": 10.0, "height": 20.0},
		FormulaConfig: FormulaConfig{
			Rules: []FormulaRule{
				{TargetOutputID: "area", Expression: "width * height"},
				{TargetOutputID: "perimeter", Expression: "2 * (width + height)"},
			},
		},
	}

	bodyBytes, _ := json.Marshal(payloadBody)
	req := httptest.NewRequest("POST", "/evaluate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to send POST /evaluate test request: %v", err)
	}

	if resp.StatusCode != 200 {
		t.Errorf("Expected HTTP 200 for POST /evaluate, got: %d", resp.StatusCode)
	}

	var resObj struct {
		Status  string                 `json:"status"`
		Results map[string]interface{} `json:"results"`
	}
	json.NewDecoder(resp.Body).Decode(&resObj)

	if resObj.Status != "success" {
		t.Errorf("Expected status 'success', got: %s", resObj.Status)
	}

	area, _ := resObj.Results["area"].(float64)
	if area != 200.0 {
		t.Errorf("Expected area = 200, got: %f", area)
	}

	perimeter, _ := resObj.Results["perimeter"].(float64)
	if perimeter != 60.0 {
		t.Errorf("Expected perimeter = 60, got: %f", perimeter)
	}
}

func TestHttpRoutes_EvaluateInvalidPayload(t *testing.T) {
	app := SetupApp()

	req := httptest.NewRequest("POST", "/evaluate", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to send invalid POST /evaluate request: %v", err)
	}

	if resp.StatusCode != 400 {
		t.Errorf("Expected HTTP 400 for malformed payload, got: %d", resp.StatusCode)
	}
}

func TestHttpRoutes_EvaluateInvalidExpressionError(t *testing.T) {
	app := SetupApp()

	payloadBody := EvaluateRequest{
		Payload: map[string]interface{}{"a": 5.0},
		FormulaConfig: FormulaConfig{
			Rules: []FormulaRule{
				{TargetOutputID: "err_target", Expression: "a + * 10"},
			},
		},
	}

	bodyBytes, _ := json.Marshal(payloadBody)
	req := httptest.NewRequest("POST", "/evaluate", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to send test request: %v", err)
	}

	if resp.StatusCode != 400 {
		t.Errorf("Expected HTTP 400 for expression error, got: %d", resp.StatusCode)
	}
}
