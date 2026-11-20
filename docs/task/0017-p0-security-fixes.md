# Task 0017: P0 Security Fixes from the Full-Stack Audit

## Summary
Fixed all P0 security findings from [task 0016](0016-full-stack-code-audit.md). Architecture decision recorded in [ADR 0009](../adr/0009-app-ownership-and-centralized-authorization.md).

## Status
Completed 2026-11-20.

## Changes

1. **Permission-guard bypass** — `auth/guards/app-permission.guard.ts` now resolves the app ID from the route param when the route has one, else `app_id` from body/query (conflicts → 400). Logic moved to `auth/app-access.service.ts`, shared via `auth/app-access.module.ts`.
2. **Record IDOR** — `GET`/`DELETE /records/:id` check access on the record's app (`RecordsService.findOneForUser` / `removeForUser`); inaccessible records return 404.
3. **Owner role** — new `UsersNAppMapping.is_owner`; `share`, `GET/PUT/DELETE /apps/:id/permissions*` and `DELETE /apps/:id` require `owner`; owners cannot be revoked; bare mapping = read-only; `calculate` with `saveRecord` requires `write`. App creation runs in a transaction. Migration `1795132800000-AppOwnershipAndScopedNames` + start-up backfill (`AppOwnershipBackfillService`).
4. **Admin panel stored XSS** — all API values escaped with `esc()` before `innerHTML`; click handlers no longer built from strings.
5. **JWT secret** — `common/config/jwt.config.ts` (no default; fails in production). Compose reads `JWT_SECRET` from gitignored `infra/docker/.env` (template: `infra/docker/.env.example`).
6. **AI service auth** — `common/guards/gateway-auth.guard.ts` on all `/agent/*` routes; token from the header only (body `userToken` ignored); `appId` validated as UUID. Frontend sends the token to `/agent/feasibility`.
7. **Misc** — CORS allow-list via `CORS_ORIGINS` (both Nest services); in-memory login rate limit (10 / 15 min per IP+route) on `/auth/login`, `/auth/register`, `/admin/login`; generic login errors + constant-time-ish bcrypt path; admin login/role endpoints use validated DTOs; role change no longer returns the password hash and admins cannot demote themselves; tool names unique per owner; `.gitignore` now keeps `.env.example` files.

## Verification
- Gateway unit tests: 5 suites, 20 tests passing (`npx jest` in `backend/api-gateway-nodejs`), incl. guard bypass, access levels, record access, JWT config.
- AI service tests: 2 suites, 7 tests passing (guard + existing agent tests).
- `tsc --noEmit` clean for gateway and AI service.
- End-to-end smoke test against a local gateway + Postgres: bypass → 403, conflicting app_id → 400, cross-tenant record GET/DELETE → 404, read-only user share/delete/save → 403, owner revoke → 403/400, foreign CORS origin gets no ACAO header, 12th bad login → 429.

## Not covered
- Frontend typecheck has 52 pre-existing errors (missing DOM lib in `tsconfig.app.json`), unrelated to this change.
- AI service has no jest config of its own; its specs were run with the gateway's jest.
