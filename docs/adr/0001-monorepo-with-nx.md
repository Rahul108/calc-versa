# ADR 0001: Adopt Nx Monorepo for Source Code Management

## Status
**Accepted**

## Context
CalcVersa consists of multiple backend microservices (Node.js, Go, Python), a React frontend single-page application, shared database ORM code (`libs/db`), shared TypeScript types (`libs/types`), and infrastructure orchestration files (`infra/`). 

Managing these components across separate git repositories (polyrepo) introduces significant overhead in type synchronization, multi-repo CI/CD orchestration, and version drift.

## Decision
We decided to adopt an **Nx Monorepo** structure (`nx.json`, `package.json`).

### Key Motivations:
1. **Shared Domain Schemas**: Both the API Gateway and React Frontend can share generated database types and TypeScript DTOs from `libs/types` and `libs/db`.
2. **Unified Task Execution**: Developers can build, test, and lint any service using standard Nx CLI commands (`npx nx build <project-name>`).
3. **Atomic Commit History**: Feature changes involving both backend services and frontend UI updates can be committed together atomically.

## Consequences

### Positive:
- Simplified code sharing across Node.js gateway, React frontend, and shared libraries.
- Standardized tooling, code style, ESLint, and TypeScript configs (`tsconfig.base.json`).
- High visibility across all codebase services.

### Negative / Trade-offs:
- Repository size grows faster than single-purpose repositories.
- CI pipelines must leverage Nx caching (`nx.json`) to avoid re-testing unchanged projects.
