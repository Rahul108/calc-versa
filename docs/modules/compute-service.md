# Module Documentation: Compute Service (Go)

## Path
`backend/compute-service-golang/`

## Tech Stack
- **Language**: Go 1.22+
- **HTTP Framework**: Fiber (`github.com/gofiber/fiber/v2`)
- **Port**: `8080` (default)

---

## Core Responsibilities
1. **High-Performance Math Evaluation**: Evaluates custom mathematical expressions, algebraic formulas, and multi-variable equations with low latency.
2. **Real-time Result Stream**: Computes outputs as users change input parameters on product tool URLs (`/product?id=33`).
3. **Stateless Scale-Out**: Pure stateless calculation service, allowing easy horizontal scaling in Docker / Kubernetes (`infra/docker/compute-service-golang.Dockerfile`).

---

## Internal Code Structure
```
backend/compute-service-golang/
├── go.mod                     # Go module definitions & dependencies
├── go.sum                     # Dependency checksum lock
└── main.go                    # Entrypoint & HTTP route server (Fiber)
```

---

## Performance Considerations
- Go's lightweight goroutines handle incoming calculation requests concurrently.
- Expressive math parsing algorithms avoid allocations on critical evaluation paths.

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/adr/0002-polyglot-microservices.md`
- `backend/compute-service-golang/go.mod`
