# Task 0009: Dynamic Formula Execution Pipeline (`POST /apps/:id/calculate`) in Go

## Summary
Implemented real-time formula computation engine in Go (`backend/compute-service-golang/`) evaluating `formulaConfig.rules` against user parameters in sub-millisecond latency (`~0.19ms`).

## Scope & Changes
- Implemented `POST /evaluate` in `main.go` using `github.com/Knetic/govaluate`.
- Created `POST /apps/:id/calculate` endpoint in API Gateway forwarding payloads to Go Compute Engine.
- Added automatic calculation logging to `AppRecord` when `saveRecord: true`.
- Activated `compute-service` in Docker Compose on host port `8085`.
