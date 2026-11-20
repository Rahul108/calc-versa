# Task 0020: P2 Maintainability & Tooling from the Full-Stack Audit

## Summary
Fixed the P2 findings of [task 0016](0016-full-stack-code-audit.md). Decisions in [ADR 0012](../adr/0012-shared-observability-library-and-tooling-cleanup.md).

## Status
Completed 2026-11-21.

## Changes
1. **`libs/observability`** (new): async `LogWriter`, safe `resolveCorrelationId`, access/error log and error-response builders, with tests. Both Nest services now use thin wrappers; `file-logger.util.ts` (sync writes) deleted.
   - Behaviour changes: 4xx logged as `WARN` without stack; non-HTTP exceptions return a generic 500 message; unsafe incoming correlation ids are replaced; `LOG_TO_FILE=false` switch.
2. **Typing**: `@CurrentUser()` + `AuthenticatedUser`; Express `Request` augmentation; no `req: any` left in controllers; `AdminGuard` no longer attaches the password hash to the request.
3. **Imports**: gateway modules import `../db` (one re-export) instead of `../../../../libs/db/src`.
4. **Admin console**: HTML moved to `src/admin/admin-panel.html` (nest-cli asset); unused AdminJS / session / socket.io dependencies removed (lockfile updated).
5. **AI service build**: entry paths updated for the shared lib (`start`, `start:dev`, `start:debug`, `start:prod`); jest + `test`/`typecheck` scripts added. Gateway `start`/`start:debug` given the correct `--entryFile`.
6. **Docker**: both Node Dockerfiles copy `libs/observability`; compose mounts it for live reload.
7. **Nx**: all `@nx/*` on 20.8.0, `@nrwl/*` removed, `eslint-config-prettier` 10, `.npmrc` with `legacy-peer-deps=true`; root lockfile regenerated.
8. **CI**: one workflow covering Go, API Gateway, AI service, Python and frontend.
9. **Docs**: observability guide, getting-started install note, ADR 0007 marked superseded, AGENTS.md ADR map.

## Verification
- Clean installs in a scratch copy (same commands as CI): libs/db, gateway, AI service and the root workspace all `npm ci` successfully.
  - Gateway: typecheck clean, 28 tests pass, build includes `admin-panel.html`.
  - AI service: typecheck clean, 20 tests pass (incl. `libs/observability`), build outputs the new entry path.
  - Frontend: tsc (app + spec), ESLint, 16 tests and `vite build` pass; **Vite dev server now starts** (HTTP 200) and `nx show projects` works.
- Runtime (built `dist` against Postgres): admin page served with escaping, safe correlation ids kept and unsafe ones replaced, `/auth/me` has no password field, self-demotion refused, AI report works through the gateway, `app-`/`error-` log files written asynchronously, 400 logged as `WARN` without stack.
- Go and Python suites unchanged from task 0018 (CI workflow YAML validated locally; not yet run on GitHub).

## Not covered
- Your existing `node_modules` was not reinstalled (it was installed on Linux). Run `npm install` at the repo root to pick up the new lockfile and macOS binaries.
- ESLint plugin peer mismatches remain (handled by `legacy-peer-deps`).
