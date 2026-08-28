# System Architecture Overview

## Executive Summary
**CalcVersa** is a multi-tenant platform designed to allow accounts to construct customized calculation tools and publish them to unique, account-isolated URLs (e.g. `http://localhost:3005/product?id=33`).

The project uses an **Nx Monorepo** layout hosting **polyglot microservices** paired with a **React SPA frontend**.

---

## High-Level System Component Diagram

```
+-------------------------------------------------------------------+
|                        React SPA Frontend                         |
|                 (frontend/src/app/app.tsx)                        |
|             URL Routes: /product?id=33, /dashboard                |
+-------------------------------------------------------------------+
                                  |
                                  v REST / WebSockets
+-------------------------------------------------------------------+
|                    NestJS API Gateway Service                     |
|                   (backend/api-gateway-nodejs)                    |
|             - Authentication & Authorization                      |
|             - Account & Tool Permission Enforcement               |
|             - Tool Definition Metadata Serving                    |
+-------------------------------------------------------------------+
           |                                       |
           | HTTP / gRPC                           | Asynchronous Events
           v                                       v (RabbitMQ)
+---------------------------+             +-------------------------+
|    Go Compute Engine      |             | Python Analysis Service |
| (compute-service-golang)  |             | (analysis-service-py)   |
| Fast formula evaluation   |             | Analytics & Batch Work  |
+---------------------------+             +-------------------------+
           |                                       |
           +-------------------+-------------------+
                               |
                               v TypeORM (libs/db)
+-------------------------------------------------------------------+
|                      PostgreSQL Database                          |
|             (Users, Apps, Mappings, Permissions)                  |
+-------------------------------------------------------------------+
```

---

## Service Responsibilities

### 1. Frontend (`frontend/`)
- Single Page Application built with **React**, **Vite**, **TypeScript**, and **TailwindCSS**.
- Dynamically renders user interface components based on tool requirements fetched for a given product ID (e.g., `id=33`).

### 2. API Gateway (`backend/api-gateway-nodejs/`)
- Built with **NestJS** and `@nestjs/typeorm`.
- Serves as the single point of entry for client requests.
- Enforces user-to-app access rules using TypeORM Entities defined in `libs/db/src/entities/`.

### 3. Compute Service (`backend/compute-service-golang/`)
- High-performance calculation microservice written in **Go** (Fiber framework).
- Responsible for real-time mathematical operations, custom expressions, and dynamic formula evaluation.

### 4. Analysis Service (`backend/analysis-service-python/`)
- Asynchronous data processing service written in **Python**.
- Handles heavy data analytics, statistical modeling, report generation, and background metrics batching.

### 5. Shared Database & Domain Layer (`libs/db/`)
- Uses **TypeORM** over **PostgreSQL**.
- Centralized data entities shared across NestJS services to manage user accounts, calculation tools (`App`), user-app mappings, and permission scopes.

---

## Related Documents
- `docs/architecture/data-model.md`
- `docs/architecture/event-driven.md`
- `docs/adr/0001-monorepo-with-nx.md`
- `docs/adr/0002-polyglot-microservices.md`
