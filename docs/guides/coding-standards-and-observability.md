# Coding Standards & Observability Guide

## Core Principle
Every microservice in **CalcVersa** (regardless of language or stack: Node.js, Go, Python) **must maintain a consistent, standardized logging pattern and error handling strategy**. This guarantees seamless end-to-end distributed tracing, origin tracking, and unified log ingestion into observability platforms (e.g. Grafana Loki, ELK, Datadog).

---

## 1. Structured JSON Logging Requirement
All log outputs must be rendered in single-line **Structured JSON** format in production.

### Standard Log Schema
```json
{
  "timestamp": "2026-08-28T19:24:00.123Z",
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

## 2. Distributed Correlation ID Propagation (`x-correlation-id`)
1. **API Gateway Responsibility**: The API Gateway (`backend/api-gateway-nodejs`) inspects every incoming HTTP request for the header `x-correlation-id` (or `x-request-id`).
   - If missing, the API Gateway **generates a new UUID v4**.
   - If present, it preserves the existing ID.
2. **Downstream Service Propagation**: When a microservice makes an internal HTTP/gRPC call to another service (e.g. Gateway -> Go Compute Service or AI Assistant Service), it **must forward the `x-correlation-id` header**.
3. **Response Header**: All microservices must include `x-correlation-id` in their HTTP response headers.

---

## 3. Request Origin & Error Origin Tracking
Logs must explicitly state:
- **Where the request originated**: `origin_ip` and `user_agent`.
- **Where the error occurred**: `service` name, `file/module` name, and `stack` trace.

---

## 4. Standardized Error Response Format
All HTTP microservices must format unhandled errors using this JSON payload structure:

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Detailed error message",
  "service": "ai-assistant-service-nodejs",
  "path": "/agent/guide",
  "correlationId": "c7a2b9f0-1234-4567-89ab-cdef01234567",
  "timestamp": "2026-08-28T19:24:00.123Z"
}
```

---

## 5. Technology Stack Observability Reference

| Technology | Logging Library / Mechanism | Middleware / Interceptor |
| :--- | :--- | :--- |
| **Node.js (NestJS)** | NestJS `Logger` + Custom `LoggingInterceptor` | `CorrelationIdMiddleware` + `AllExceptionsFilter` |
| **Go (Fiber)** | Go 1.22 standard `log/slog` (JSON handler) | Custom Fiber Middleware for `x-correlation-id` |
| **Python (FastAPI)** | `logging` with JSON Formatter / `structlog` | FastAPI Middleware for `x-correlation-id` |

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/architecture/event-driven.md`
- `AGENTS.md`
