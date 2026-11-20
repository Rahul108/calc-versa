# Task 0019: Frontend Fixes from the Full-Stack Audit

## Summary
Reworked the React SPA per the frontend findings of [task 0016](0016-full-stack-code-audit.md). Decisions recorded in [ADR 0011](../adr/0011-frontend-session-and-data-loading.md).

## Status
Completed 2026-11-21.

## Changes
1. **No more fake data**: removed every mock fallback (dashboard tools, tool config, records, analytics, "submitted locally" saves). Errors show the server message with retry.
2. **Auth**: `AuthProvider` + `RequireAuth`/`RequireAdmin`; `/auth/me` validation, logout on 401 or token expiry, redirect back after login; no pre-filled credentials.
3. **API layer**: `apiFetch` + typed `api` module; URLs from `VITE_API_GATEWAY_URL` / `VITE_AI_ASSISTANT_URL` (Dockerfile build args, compose, `.env.example`).
4. **Tool page split**: `pages/product/` → `ProductToolPage`, `FormEntryTab`, `RecordsTab`, `AnalyticsTab`, `toolMeta`; shared `DynamicField` and `lib/fields.ts` (type normalisation incl. `dropdown`→`select`, defaults, validated typed payloads).
5. **Access-aware UI**: gateway `GET /apps/:id` now returns `access`; read-only users get Calculate only; delete hidden without write.
6. **Generic records/analytics**: columns from `inputsConfig`, result labels/format from `formulaConfig.outputs`, currency from `uiConfig.currency`; analytics uses per-member `totalAmount` (added to the SQL aggregation), monthly breakdown shown, lists sorted.
7. **Builder**: immutable state updates (fixed in-place mutation), identifier/duplicate validation, multiple formulas with labels and formats, tool kind and currency, preview via `DynamicField`.
8. **AI copilot**: example as placeholder (not pre-filled), labelled inputs, warnings shown, create disabled unless feasible and safety-validated; AI drafts tagged `uiConfig.source = 'ai'` (replaces the "name contains AI" badge heuristic).
9. **UX/a11y**: labels tied to inputs, field-level errors with `aria-describedby`, ARIA tabs, skip link, focus-visible outlines, inline delete confirmation (no `alert`/`confirm`), loading/empty/error states, removed fabricated stats ("< 0.2ms").
10. **Styling**: inline styles replaced with utility classes in `styles.css` across all pages.
11. **Tooling**: fixed `tsconfig` (DOM libs; 52 → 0 type errors), `jest.config.js` (the TS config could not be parsed), removed dead `nx-welcome.tsx`, replaced stale unit and e2e tests.
12. **Seed fix**: the expense tracker stored `formulaConfig.formulas[].target`, which the compute engine ignores, so saved entries had empty results (previously hidden by the UI's fake fallback). Seed now uses `rules[].targetOutputId`, adds `outputs` and `uiConfig.analytics`. Re-run the seed to update existing databases.

## Verification
- Frontend: 4 suites / 16 tests pass; `tsc` clean for app and spec configs; ESLint clean; `vite build` succeeds with per-page chunks.
- Gateway: 28 tests pass; `tsc` clean.
- In the browser against local Postgres + gateway + Go + AI services: login redirect-back, tracker save → real Go result (`Tk 150.00`), entries table, summary totals (Tk 6,780 = sum of entries), inline delete, read-only badge and hidden save, "No access to this tool" for a 403, non-admin nav without creator links, builder → new tool → correct mortgage payment (`$1,580.17`).

## Not covered
- `vite` dev server fails on macOS with this `node_modules` (installed on Linux; Nx's native watcher). Verified with `vite preview` of the production build instead. For local builds I added the macOS `@rollup/rollup-darwin-arm64` and `@esbuild/darwin-arm64` packages to `node_modules` only (no package file changes); a clean `npm install` on the Mac would fix this properly.
- Playwright e2e test was updated but not run.
- JWT remains in `localStorage` (see ADR 0011).
