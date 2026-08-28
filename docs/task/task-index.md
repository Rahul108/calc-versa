# CalcVersa Task History & Audit Index

This directory (`docs/task/`) serves as the official tracking record of all feature developments, architectural implementations, bug fixes, and testing tasks performed across the CalcVersa codebase.

> **STRICT AGENT RULE**: Every new task mentioned or performed in the codebase **MUST** be recorded and tracked under `docs/task/`.

---

## Master Task Index

| Task ID | Title / Feature Scope | Status | Key References / Commits |
| :--- | :--- | :--- | :--- |
| **[`0001`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0001-initial-project-setup.md)** | Initial Monorepo Structure & Polyglot Microservices Setup | Completed | Nx workspace, `backend/`, `libs/db` |
| **[`0002`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0002-database-schema-typeorm-migration.md)** | Database Schema Design & TypeORM Migration | Completed | `libs/db/src/entities/`, TypeORM migration |
| **[`0003`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0003-ai-assistant-service-gemini.md)** | AI Assistant Microservice with Gemini API | Completed | `backend/ai-assistant-service-nodejs/` |
| **[`0004`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0004-observability-logging-correlation-id.md)** | Standardized Observability, JSON Logging & Rotational Log Files | Completed | Rotational logger, `x-correlation-id` |
| **[`0005`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0005-docker-compose-infra.md)** | Docker Compose Single-Command Local Runtime Infrastructure | Completed | `infra/docker/docker-compose.yml` |
| **[`0006`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0006-api-gateway-core-apis.md)** | API Gateway Auth (`/auth`), Apps (`/apps`), and Records (`/records`) REST APIs | Completed | `backend/api-gateway-nodejs/src/` |
| **[`0007`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0007-user-permissions-apis.md)** | User Permission Management APIs & Granular Access Control | Completed | `backend/api-gateway-nodejs/src/permissions/` |
| **[`0008`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0008-admin-management-panel.md)** | Super-Admin Management Panel Web Console & `AdminGuard` Security | Completed | `http://localhost:3005/admin`, `is_admin` |
| **[`0009`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0009-realtime-formula-compute-engine.md)** | Dynamic Formula Execution Pipeline (`POST /apps/:id/calculate`) in Go | Completed | `backend/compute-service-golang/` |
| **[`0010`](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/task/0010-go-compute-engine-unit-tests.md)** | Go Compute Engine Unit Test Suite (82.1% Coverage) | Completed | `backend/compute-service-golang/main_test.go` |
