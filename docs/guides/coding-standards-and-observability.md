# Coding Standards & Observability Guide

## Core Principle
Every microservice in **CalcVersa** (regardless of language or stack: Node.js, Go, Python) **must maintain a consistent, standardized logging pattern, daily rotational file logging, and error handling strategy**. This guarantees seamless end-to-end distributed tracing, origin tracking, local log auditing, and unified log ingestion into observability platforms (e.g. Grafana Loki, ELK, Datadog).

---

## 1. Daily Rotational File Logging (`logs/`)
Each microservice maintains a local `logs/` folder (strictly ignored in `.gitignore`) and outputs logs to two daily rotating files:

1. **`logs/app-YYYY-MM-DD.log`**: Contains all log entries (`INFO`, `WARN`, `ERROR`, `DEBUG`).
2. **`logs/error-YYYY-MM-DD.log`**: Contains exclusively `ERROR` level log entries.

Additionally, structured JSON logs must continue streaming to `stdout`/`stderr` for container orchestration (Docker / Kubernetes).

---

## 2. Structured JSON Logging Requirement
All log outputs (console and log files) must be rendered in single-line **Structured JSON** format.

### Standard Log Schema
```json
{
  "timestamp": "2026-08-28T19:33:00.123Z",
  "level": "INFO|WARN|ERROR|DEBUG",
  "service": "<service-name>",
  "correlation_id": "<uuid-or-inherited-id>",
  "request": {
    "method": "POST",
    "url": "/agent/guide",
    "origin_ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  },
  "duration_ms": 45.2,
  "status_code": 200,
  "message": "Human readable log summary message",
  "error": {
    "code": "ERROR_CODE_NAME",
    "stack": "Stack trace string (if level is ERROR)"
  }
}
```

---

## 3. Distributed Correlation ID Propagation (`x-correlation-id`)
1. **API Gateway Responsibility**: The API Gateway (`backend/api-gateway-nodejs`) inspects every incoming HTTP request for the header `x-correlation-id` (or `x-request-id`).
   - If missing, the API Gateway **generates a new UUID v4**.
   - If present, it preserves the existing ID.
2. **Downstream Service Propagation**: When a microservice makes an internal HTTP/gRPC call to another service (e.g. Gateway -> Go Compute Service or AI Assistant Service), it **must forward the `x-correlation-id` header**.
3. **Response Header**: All microservices must include `x-correlation-id` in their HTTP response headers.

---

## 4. Request Origin & Error Origin Tracking
Logs must explicitly state:
- **Where the request originated**: `origin_ip` and `user_agent`.
- **Where the error occurred**: `service` name, `file/module` name, and `stack` trace.

---

## 5. Standardized Error Response Format
All HTTP microservices must format unhandled errors using this JSON payload structure:

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Detailed error message",
  "service": "ai-assistant-service-nodejs",
  "path": "/agent/guide",
  "correlationId": "c7a2b9f0-1234-4567-89ab-cdef01234567",
  "timestamp": "2026-08-28T19:33:00.123Z"
}
```

---

## 6. Technology Stack Rotational Logging Reference

| Microservice | Technology | Console Output | Rotational Log Files (`logs/`) |
| :--- | :--- | :--- | :--- |
| **`api-gateway-nodejs`** | Node.js / NestJS | JSON `stdout`/`stderr` | `FileLogger` -> `app-YYYY-MM-DD.log` & `error-YYYY-MM-DD.log` |
| **`ai-assistant-service-nodejs`** | Node.js / NestJS | JSON `stdout`/`stderr` | `FileLogger` -> `app-YYYY-MM-DD.log` & `error-YYYY-MM-DD.log` |
| **`compute-service-golang`** | Go 1.22 / Fiber | JSON `stdout` | `RotationalFileWriter` -> `app-YYYY-MM-DD.log` & `error-YYYY-MM-DD.log` |
| **`analysis-service-python`** | Python / FastAPI | JSON `stdout` | `TimedRotatingFileHandler` -> `app-YYYY-MM-DD.log` & `error-YYYY-MM-DD.log` |

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/architecture/event-driven.md`
- `AGENTS.md`
