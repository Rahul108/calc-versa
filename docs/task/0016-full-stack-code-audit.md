# Task 0016: Full-Stack Code Audit (Backend & Frontend)

## Summary
Read-only audit of every service (`api-gateway-nodejs`, `ai-assistant-service-nodejs`, `compute-service-golang`, `analysis-service-python`), `libs/db`, `infra/docker` and `frontend/`. No code was changed. Findings are ranked by severity below; each one is a candidate follow-up task.

## Status
Audit completed 2026-11-20. P0 items fixed in [task 0017](0017-p0-security-fixes.md), P1 items in [task 0018](0018-p1-reliability-fixes.md), frontend items in [task 0019](0019-frontend-fixes.md), P2 items in [task 0020](0020-p2-maintainability.md). All audit items addressed.

## P0 — Security (fix before anything else)

1. **Permission-guard bypass via query string** — `backend/api-gateway-nodejs/src/auth/guards/app-permission.guard.ts:49`
   The guard picks the app ID from `query.id` *before* `params.id`/`body.app_id`, but controllers act on `@Param('id')` / `dto.app_id`.
   `PUT /apps/<victimId>?id=<myAppId>` passes the check on the attacker's own app and then edits, deletes, shares or reads the victim's app. Same for `POST /records?id=<mine>` with `app_id=<victim>` in the body.
   Fix: resolve the ID from one source per route (e.g. decorator option `@RequireAppPermission('write', { from: 'param' })`).
2. **Unguarded record endpoints (IDOR)** — `records.controller.ts:47-59`
   `GET /records/:id` and `DELETE /records/:id` only require login; any user can read/delete any record by UUID.
3. **Stored XSS → admin takeover** — `admin/admin.controller.ts` (inline admin panel)
   Usernames, emails, app names/descriptions and JSON payloads are written with `innerHTML` unescaped. A user who registers as `<img src=x onerror=...>` runs script in the admin's session and can read the admin JWT from `sessionStorage`.
4. **Hard-coded JWT secret fallback** (`calcversa_secret_jwt_key_2026`) in 4 places and committed in `docker-compose.yml`. Fail fast at boot if `JWT_SECRET` is unset; centralise in `@nestjs/config`.
5. **Privilege model** — any `write` user can share with `write`, re-grant themselves, or revoke the owner (`permissions.service.ts`, `apps.service.ts#share`). Mapping alone (no `UserPermission` row) silently grants write. Add an explicit `owner`/`admin` role per app.
6. **AI service has no auth** — all `/agent/*` routes are open; `/agent/feasibility` lets anyone burn Gemini quota. `updateTool` interpolates `dto.appId` into a URL unvalidated (`apps/${dto.appId}`) — validate as UUID.
7. **Misc**: CORS `origin: '*'` with `credentials: true`; no rate limiting on `/auth/login` and `/admin/login` (add `@nestjs/throttler`); admin login reveals whether an account is an admin; `toggleAdminRole` returns the full user incl. password hash; app `name` is globally unique, leaking other tenants' tool names.

## P1 — Correctness & reliability

- **Go compute returns 400/500 on divide-by-zero**: `+Inf`/`NaN` cannot be JSON-encoded. Detect non-finite results and return a typed error.
- **Go**: expressions are re-parsed per request (cache compiled `govaluate` expressions by hash); `govaluate` is unmaintained — consider `expr-lang/expr` with a restricted env; `go.mod` marks every dep `// indirect` (run `go mod tidy`); default port 8080 vs gateway default 8085.
- **Gateway → compute call**: no timeout (`AbortSignal.timeout`), compute outages surface as 400 instead of 502/503, `x-correlation-id` not forwarded (breaks the project's own observability standard).
- **Aggregation** (`apps.service.ts#aggregateRecords`) loads every record into memory and guesses "amount" from key names (`amount|expense|cost`) and member from `member_name`. Move to SQL (`jsonb` + `GROUP BY date_trunc`) or the Python analysis service, driven by declared fields in `uiConfig`.
- **Inconsistent record visibility**: `GET /records` filters by `user_id`, `GET /apps/:id/records` returns all users' records.
- **Unvalidated bodies**: `POST /admin/login` and `POST /apps/:id/aggregate` take `any`/inline types, so `ValidationPipe` does nothing. Add DTOs.
- **No transactions**: `create`/`share`/`updateUserPermission` do multi-row writes without `dataSource.transaction`.
- **Schema management**: `synchronize: true` in every non-production env and `migrations: []` even though a migration exists. Use migrations everywhere.
- **AI JSON parsing** uses a greedy `/\{[\s\S]*\}/` regex; use Gemini `responseMimeType: 'application/json'` + `responseSchema`, then validate. `generateReport` and `processOperation` return hard-coded fake data.
- **Sanitizer false positives**: `/import\s*/` and `/constructor/` reject legit variables like `important_rate`.
- **Python analysis service** is a stub returning constant `{mean: 42.5}`; its log rotation names files with the start-up date only.

## P2 — Maintainability / DX

- Duplicate observability code (filter, interceptor, file logger, middleware) copy-pasted between the two Nest services → extract to `libs/observability`.
- Deep relative imports (`../../../../libs/db/src`) → Nx path alias `@calc-versa/db`.
- `req: any` everywhere → `@CurrentUser()` decorator with typed payload.
- Sync `fs.appendFileSync` on every request blocks the event loop → `pino` (+ stdout only in containers).
- Admin panel is ~250 lines of HTML in a controller string; AdminJS is a dependency (ADR 0007) but unused.
- Tests: gateway has only the Nest "Hello World" spec; no service/guard tests (the guard bypass above would have been caught). CI runs only Go tests.
- `.gitignore` pattern `.env*` also ignores `.env.example` files.
- Root `package.json` mixes Nx 19.8 and 20.8 packages.

## Frontend findings

- **Silent mock fallbacks hide real failures**: `DashboardPage` shows fake tools on any error; `ProductToolPage` shows a fake 7-member tracker when the app fails to load (incl. 403), and on a failed save shows "Record submitted locally" with a fabricated result even though nothing was saved.
- **No auth flow**: no protected routes, no 401 handling/redirect, no logout-on-expiry; JWT in `localStorage` (pair with a strict CSP or move to httpOnly cookie).
- **Hard-coded URLs** `http://localhost:3005/3006` in `services/api.ts` → `import.meta.env.VITE_API_URL`, or proxy `/api` via Vite dev server and nginx.
- **Pre-filled demo credentials** in `LoginPage` (`johndoe` / `Password123!`).
- **Inline styles**: ~215 `style={{...}}` across pages even though Tailwind is configured. `ProductToolPage.tsx` is 660 lines — split into `FormEntryTab`, `RecordsTab`, `AnalyticsTab`, `DynamicField`.
- **Types**: `any` for apps, fields, records — define shared types in `libs/types` (folder exists, empty) and reuse in the gateway DTOs.
- **Data fetching**: hand-rolled `useEffect` + state, `react-hooks/exhaustive-deps` violations (`loadApp`, `loadRecords`), no caching → TanStack Query; one `apiFetch` wrapper instead of 10 near-identical functions.
- **Schema drift**: the AI service emits `dropdown`, the tracker uses `select`; currency defaults to `Tk` in UI state.
- **UX/a11y**: `alert`/`confirm` dialogs, missing `<label htmlFor>` associations, no loading/empty/error states per tab, no code-splitting of routes.
- **Tests are stale**: `app.spec.tsx` and `frontend-e2e/src/example.spec.ts` still assert the Nx "Welcome" text; `nx-welcome.tsx` (856 lines) is dead code.
