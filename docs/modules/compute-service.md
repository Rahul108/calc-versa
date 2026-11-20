# Module Documentation: Compute Service (Go)

## Path
`backend/compute-service-golang/`

## Tech Stack
- **Language**: Go 1.22+
- **HTTP Framework**: Fiber (`github.com/gofiber/fiber/v2`)
- **Expression Engine**: `github.com/Knetic/govaluate`
- **Host Port**: `8085` (Container Port `8080`; the binary defaults to `8085` when `PORT` is unset)

---

## Core Responsibilities
1. **High-Performance Math Evaluation**: Evaluates custom mathematical expressions, algebraic formulas, and multi-variable equations in `<2ms`.
2. **Dynamic Expression Resolution**: Parses `formulaConfig.rules` dynamically passed from API Gateway (`POST /apps/:id/calculate`).
3. **Stateless Scale-Out**: Pure stateless calculation service allowing horizontal scaling in Docker (`infra/docker/compute-service-golang.Dockerfile`).
4. **Compiled-Expression Cache**: Parsed expressions are cached (bounded to 10,000) so repeat calculations skip parsing.
5. **Safe Results**: A rule that yields `+Inf`/`NaN` (e.g. division by zero) returns `400 EvaluationError` instead of failing JSON encoding with a 500. Request bodies are capped at 1 MB with 10s read/write timeouts.

### Gateway integration
The API Gateway calls `POST /evaluate` through `ComputeClientService` (timeout `COMPUTE_TIMEOUT_MS`, default 5000; forwards `x-correlation-id`). Engine 4xx → gateway 400 with the engine's message; engine 5xx/invalid body → 502; unreachable/timeout → 503.

---

## Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health check |
| `POST` | `/evaluate` | Evaluates dynamic formula rules against user input parameters |

### `POST /evaluate` Example Request:
```json
{
  "payload": { "principal": 300000, "annual_rate": 6.5, "term_years": 30 },
  "formulaConfig": {
    "rules": [
      {
        "targetOutputId": "monthly_payment",
        "expression": "(principal * (annual_rate / 1200)) / (1 - (1 + (annual_rate / 1200)) ** (-1 * term_years * 12))"
      }
    ]
  }
}
```

### Response (`<2ms` latency):
```json
{
  "status": "success",
  "results": {
    "monthly_payment": 1896.204070478898
  },
  "duration_ms": 0.19,
  "service": "compute-service-golang"
}
```

---

## Performance & Benchmarks
- Go goroutines process calculation requests concurrently.
- Expressive math parsing (`govaluate`) achieves sub-millisecond execution (`~0.19ms`).

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/adr/0002-polyglot-microservices.md`
- `backend/compute-service-golang/main.go`
