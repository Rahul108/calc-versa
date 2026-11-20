# Task 0018: P1 Reliability & Correctness Fixes from the Full-Stack Audit

## Summary
Fixed the P1 findings from [task 0016](0016-full-stack-code-audit.md). Decisions recorded in [ADR 0010](../adr/0010-migration-managed-schema-and-sql-analytics.md).

## Status
Completed 2026-11-21.

## Changes

1. **Go compute engine** (`backend/compute-service-golang/main.go`)
   - `+Inf`/`NaN` results (division by zero) return `400 EvaluationError` instead of a 500 JSON-encoding failure.
   - Compiled expressions cached (bounded at 10,000).
   - Fiber body limit 1 MB and read/write/idle timeouts; error bodies carry `correlationId`.
   - `go mod tidy` (direct deps no longer marked `// indirect`); default port 8085 to match the gateway's default URL.
2. **Gateway → compute** (`apps/compute-client.service.ts`): 5s timeout (`COMPUTE_TIMEOUT_MS`), forwards `x-correlation-id`, maps engine 4xx → 400, 5xx/invalid → 502, unreachable/timeout → 503.
3. **Aggregation in SQL** (`apps/record-analytics.service.ts`): one parameterised query; optional `uiConfig.analytics` field mapping; inverted date ranges → 400.
4. **Record visibility**: `GET /records` now returns all records of the app (same as `GET /apps/:id/records`); `mine=true` filters to the caller.
5. **Transactions**: sharing, permission updates and revocation go through `AppAccessService.grant` / `revoke` in a single transaction (also deduplicates permission rows and re-activates inactive mappings). App creation was already transactional (task 0017).
6. **Validation**: `:userId` route params parsed as UUIDs; aggregate body uses `AggregateRecordsDto` (task 0017).
7. **Schema management** (`libs/db`): migrations in all environments, run by the gateway on start-up with automatic baselining of `synchronize`-built databases; new `AddUserIsAdmin` migration; initial migration creates `uuid-ossp`; shared `dataSourceOptions`.
8. **AI service**: Gemini JSON mode + robust `parseModelJson`; 30s Gemini and 10s gateway timeouts; `/agent/report` uses live gateway data; `/agent/operate` returns 501 instead of a fake success; sanitizer matches whole words only.
9. **Python analysis service**: real descriptive statistics on `POST /analysis/process` (was a constant stub); daily log files named `app-YYYY-MM-DD.log`; tests added.
10. **Login rate limiter** (follow-up to task 0017): counts only failed attempts, so successful logins never trigger a lockout.

## Verification
- API Gateway: 8 suites / 28 tests pass; `tsc --noEmit` clean.
- AI service: 4 suites / 16 tests pass (run with the gateway's jest); `tsc --noEmit` clean.
- Go: `go vet` clean, `go test -race` passes, coverage 86.9%.
- Python: 5 pytest tests pass.
- Against local Postgres + running services:
  - Legacy `synchronize` DB → baselined, 2 migrations applied, owners backfilled correctly; fresh DB → all 3 migrations applied. Both show 0 schema differences vs entities.
  - SQL aggregation output identical to the old JS implementation on 13 records × 3 date ranges, except the intended boolean fix.
  - Gateway + Go: normal calc OK, correlation id reached Go logs, divide-by-zero → 400 with message, compute stopped → 503.
  - `GET /records`: all=1 / mine=0 for a read-only collaborator.
  - AI: report without token 401, with token live counts, operate 501, feasibility works in fallback mode.
  - Task 0017 security smoke test re-run: all checks still pass.

## Not covered
- Gemini JSON mode was not exercised against the live API (tests ran in fallback mode with no key).
- CI still only runs Go tests; gateway/AI/Python suites should be added (P2).
