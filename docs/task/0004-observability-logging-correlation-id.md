# Task 0004: Standardized Observability, JSON Logging & Rotational Log Files

## Summary
Implemented standardized JSON structured logging, `x-correlation-id` request tracing middleware, and rotational file logging across all microservices (`docs/guides/coding-standards-and-observability.md`).

## Scope & Changes
- Created `CorrelationIdMiddleware` propagating `x-correlation-id` across HTTP headers.
- Created `RotationalFileWriter` streaming logs to `logs/app-<date>.log` and `logs/error-<date>.log`.
- Standardized exception response payloads across microservices.
