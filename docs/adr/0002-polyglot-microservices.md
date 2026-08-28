# ADR 0002: Polyglot Microservices Architecture

## Status
**Accepted**

## Context
CalcVersa requires diverse backend capabilities:
1. Handling API routing, user authentication, account management, and dynamic web requests.
2. Executing dynamic user-defined mathematical formulas and calculations with ultra-low latency.
3. Performing heavy data analytics, statistical batch calculations, and dataset processing.

A single backend programming language or monolithic application would force trade-offs between calculation throughput, web ecosystem richness, and data science capabilities.

## Decision
We decided to adopt a **Polyglot Microservices Architecture** organized under `backend/`:

1. **NestJS (Node.js)** (`backend/api-gateway-nodejs`): Serves as the primary API Gateway, managing Auth, session handling, user accounts, and tool metadata REST endpoints.
2. **Go (Fiber framework)** (`backend/compute-service-golang`): Dedicated high-throughput compute engine for evaluating math formulas and custom tool logic fast.
3. **Python** (`backend/analysis-service-python`): Specialized service for data analytics, statistical evaluation, and batch report generation.

## Consequences

### Positive:
- **Optimal Tooling for the Job**: Go delivers minimal memory overhead and high concurrency for calculations; Python provides rich math/data libraries; NestJS provides rapid API and auth development.
- **Independent Scalability**: Compute-heavy Go instances can scale horizontally during peak calculation load without scaling the API gateway.

### Negative / Trade-offs:
- Requires developers to work across TypeScript, Go, and Python.
- Containerization and orchestration overhead (`infra/docker/` and `infra/k8s/`).
