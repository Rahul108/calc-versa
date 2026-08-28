# Agent Guidance & Context Directory Map

Welcome to the **CalcVersa** codebase! This file serves as the primary navigation guide for AI agents and developer tools working on this codebase.

## Project Vision & Core Goal
CalcVersa is a multi-tenant, microservices-powered platform that enables users to define custom calculation tool requirements and serve account-specific calculation tools under dedicated URLs (e.g. `http://localhost:3005/product?id=33`).

---

## How to Get Project Context

All architectural context, design decisions, module details, and operational guides are organized within the `docs/` directory. When analyzing, modifying, or extending this project, refer to the context files in `docs/` according to your specific task:

### Context Directory Index

```
docs/
├── adr/                         # Architectural Decision Records
│   ├── 0001-monorepo-with-nx.md
│   ├── 0002-polyglot-microservices.md
│   ├── 0003-account-specific-tool-schema.md
│   ├── 0004-migrate-from-prisma-to-typeorm.md
│   └── 0005-ai-assistant-agent-microservice.md
├── architecture/                # System Architecture & Design Data
│   ├── overview.md
│   ├── data-model.md
│   └── event-driven.md
├── guides/                      # Development & Workflow Guides
│   ├── getting-started.md
│   ├── creating-a-calculator-tool.md
│   └── coding-standards-and-observability.md
├── modules/                     # Sub-system & Service Documentation
│   ├── api-gateway.md
│   ├── compute-service.md
│   ├── analysis-service.md
│   ├── ai-assistant-service.md
│   └── frontend.md
└── bugfix/                      # Troubleshooting & Issue Resolution
    └── troubleshooting-guide.md
```

---

## Context Lookup Matrix for AI Agents

| If your task involves... | Read these files first | Key codebase references |
| :--- | :--- | :--- |
| **Understanding overall architecture** | `docs/architecture/overview.md` | `nx.json`, `package.json` |
| **Database changes & domain models** | `docs/architecture/data-model.md` | `libs/db/src/entities/` |
| **Adding or modifying API endpoints / Auth** | `docs/modules/api-gateway.md` | `backend/api-gateway-nodejs/src/` |
| **Heavy math / formula calculation logic** | `docs/modules/compute-service.md` | `backend/compute-service-golang/` |
| **Analytics, statistical processing** | `docs/modules/analysis-service.md` | `backend/analysis-service-python/` |
| **Prompt guidance, AI operations, Gemini API** | `docs/modules/ai-assistant-service.md` | `backend/ai-assistant-service-nodejs/` |
| **UI components, routing, `/product?id=33`** | `docs/modules/frontend.md` | `frontend/src/app/app.tsx` |
| **Async messages, events, background jobs** | `docs/architecture/event-driven.md` | `infra/rabbitmq/` |
| **Logging standards, observability, errors** | `docs/guides/coding-standards-and-observability.md` | `backend/*/src/` |
| **Understanding past architectural decisions** | `docs/adr/` | `docs/adr/0001-monorepo-with-nx.md`, `docs/adr/0005-ai-assistant-agent-microservice.md` |
| **Setting up local environment or debugging** | `docs/guides/getting-started.md`, `docs/bugfix/troubleshooting-guide.md` | `infra/docker/docker-compose.yml` |

---

## Codebase Conventions for Agents

1. **Relative Paths**: Always refer to project files using relative paths from the root directory (e.g., `libs/db/src/entities/User.entity.ts`, `backend/api-gateway-nodejs/src/main.ts`).
2. **Architectural Changes & ADRs**: If any architectural or structural changes are made (e.g., changing ORMs, adding microservices, modifying key protocols), **you MUST document the decision in a new or updated Architectural Decision Record (ADR) under `docs/adr/`**.
3. **Monorepo Management**: Use Nx commands for building, testing, and linting (`npx nx build <project>`, `npx nx test <project>`).
4. **Database Schema Integrity**: Any modifications to user permissions or tool definitions must be reflected in `libs/db/src/entities/` using TypeORM decorator annotations and applied via migrations or DataSource sync.
5. **Preserve Polyglot Microservice Boundaries**: Keep API Gateway logic (NestJS), formula calculation logic (Go), analytics logic (Python), and AI agent guidance (NestJS/Gemini) decoupled within their respective service folders under `backend/`.
6. **Standardized Observability & Logging**: Every microservice MUST follow the standardized logging pattern documented in `docs/guides/coding-standards-and-observability.md` (structured JSON format, `x-correlation-id` header propagation, request origin tracking, and standardized exception responses).
7. **Automatic Commit Message Suggestions**: At the end of every response after completing code edits, refactoring, feature implementations, or file updates, **you MUST proactively provide a suggested Conventional Commit message** summarizing the changes made so the user does not need to ask.
