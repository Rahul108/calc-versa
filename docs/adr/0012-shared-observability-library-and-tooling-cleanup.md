# 0012. Shared Observability Library & Tooling Cleanup

- **Status**: Accepted
- **Date**: 2026-11-21
- **Deciders**: Core Engineering
- **Supersedes**: [ADR 0007](0007-integrate-adminjs-management-panel.md)

---

## Context & Problem Statement

P2 findings from the audit ([task 0016](../task/0016-full-stack-code-audit.md)):
1. The exception filter, logging interceptor, correlation-id middleware and file logger were copy-pasted between the two NestJS services (differing only by service name), and the logger used `fs.appendFileSync` on every request.
2. Services imported the db library through long relative paths and used `req: any` throughout.
3. AdminJS, express-session and socket.io were dependencies but never used; the admin console was ~330 lines of HTML inside a controller string.
4. The root `package.json` mixed Nx 19.8 and 20.8 packages, leaving a nested Nx 19 under `@nx/vite` (the cause of the dev-server crash `Watcher is not a constructor`).
5. CI ran only the Go tests.

## Decision Outcome

1. **`libs/observability`**, a framework-free TypeScript library (Node built-ins only): `LogWriter` (async daily files + stdout/stderr), `resolveCorrelationId`, and log/error payload builders. Each Nest service keeps ~60 lines of thin wrappers.
   - *Why framework-free*: libraries outside a service resolve their own `node_modules`; importing `@nestjs/common` from a shared lib would load a second copy and break `instanceof HttpException` in the filters.
   - The AI service now compiles the shared lib too, so its entry is `dist/backend/ai-assistant-service-nodejs/src/main.js` (same layout as the gateway). Dockerfiles and compose mount/copy `libs/observability`.
2. **Typed request context**: `@CurrentUser()` decorator + `AuthenticatedUser`, Express `Request` augmentation (`correlationId`, `appAccess`, `user`). `AdminGuard` attaches only `{ id, username, email }` (previously the full entity including the password hash).
3. **Single db import point** in the gateway (`src/db.ts`). A TS path alias was rejected: `nest build` does not rewrite aliases, so it would need runtime path registration or a bundler.
4. **Admin console** moved to `src/admin/admin-panel.html` (copied by `nest-cli.json` assets). AdminJS, `@adminjs/*`, `express-session` and socket.io packages removed.
5. **Nx aligned on 20.8.0** (all `@nx/*`), `@nrwl/*` aliases removed, `eslint-config-prettier` → 10; `.npmrc` sets `legacy-peer-deps=true`, matching the Dockerfiles. A fresh install has a single Nx copy and the Vite dev server works.
6. **CI** (`.github/workflows/ci.yml`): Go (vet, gofmt, race tests), API Gateway (typecheck, jest, build), AI service (typecheck, jest incl. `libs/observability`, build), Python (pytest), frontend (tsc, eslint, jest, vite build).

## Consequences
- Logging changes are made once in `libs/observability`.
- Developers must re-run `npm install` at the root after pulling (lockfile changed).
- Remaining peer-dependency mismatches (ESLint plugins vs ESLint 9) are tolerated via `legacy-peer-deps`; upgrading those plugins is a separate task.
