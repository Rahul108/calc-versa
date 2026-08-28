# Module Documentation: Compute Service (Go)

## Path
`backend/compute-service-golang/`

## Tech Stack
- **Language**: Go 1.22+
- **HTTP Framework**: Fiber (`github.com/gofiber/fiber/v2`)
- **Expression Engine**: `github.com/Knetic/govaluate`
- **Host Port**: `8085` (Container Port `8080`)

---

## Core Responsibilities
1. **High-Performance Math Evaluation**: Evaluates custom mathematical expressions, algebraic formulas, and multi-variable equations in `<2ms`.
2. **Dynamic Expression Resolution**: Parses `formulaConfig.rules` dynamically passed from API Gateway (`POST /apps/:id/calculate`).
3. **Stateless Scale-Out**: Pure stateless calculation service allowing horizontal scaling in Docker (`infra/docker/compute-service-golang.Dockerfile`).

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
