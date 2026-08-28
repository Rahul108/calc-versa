# Task 0011: GitHub Actions CI Workflow for Go Compute Engine

## Summary
Configured a lightweight, fast GitHub Actions CI pipeline ([`.github/workflows/ci.yml`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/.github/workflows/ci.yml)) that runs Go Compute Engine unit tests on every push and pull request to prevent GitHub CI build failures.

## Scope & Changes
- Updated `.github/workflows/ci.yml` using `actions/setup-go@v5` (Go 1.22).
- Executes `go test -v -cover ./...` inside `backend/compute-service-golang`.
- Ensures zero CI build errors on GitHub push operations.
