# 0011. Frontend Session Handling, Data Loading & Access-Aware UI

- **Status**: Accepted
- **Date**: 2026-11-21
- **Deciders**: Core Engineering

---

## Context & Problem Statement

From the audit ([task 0016](../task/0016-full-stack-code-audit.md)), the SPA:
- replaced failed requests with hard-coded mock tools, records and analytics, and reported failed saves as "submitted locally";
- had no protected routes, no handling of expired tokens, and pre-filled demo credentials;
- hard-coded `http://localhost:3005/3006`;
- hard-coded the expense tracker's field names in the "generic" tool runner;
- could not see the caller's permission, so read-only users hit 403s on save after the P0 owner/write rules ([ADR 0009](0009-app-ownership-and-centralized-authorization.md)).

## Decision Outcome

1. **One HTTP layer** (`services/http.ts` `apiFetch`): attaches the token, turns non-2xx responses into `ApiError` with the server message, and on 401 clears the token and emits `calcversa:unauthorized`.
2. **AuthProvider** owns the session: validates the stored token with `/auth/me`, logs out on 401 or at the token's `exp`, and redirects to `/login` remembering the target page. Routes are wrapped in `RequireAuth` / `RequireAdmin`.
3. **Errors are shown, never masked**: `useAsync` exposes `loading / error / reload`; pages render `Loading`, `ErrorState` (with retry) or `EmptyState`.
4. **Access in the API response**: `GET /apps/:id` now returns `access: { read, write, owner }` (from the guard's check). The UI hides save/delete for read-only users instead of waiting for a 403.
5. **Metadata-driven tool page**: columns, labels and amounts come from `inputsConfig`, `formulaConfig.outputs` and `uiConfig` (`toolType`, `currency`, `analytics.amountField`), not from expense-tracker field names.
6. **Build-time configuration** for API URLs (`VITE_API_GATEWAY_URL`, `VITE_AI_ASSISTANT_URL`).
7. **No new runtime dependencies**: a small `useAsync` hook instead of a data-fetching library; existing CSS design system extended with utility classes instead of switching to Tailwind.

## Consequences
- Users with expired tokens are sent to login instead of seeing fake data.
- Tools should declare `formulaConfig.outputs` labels and `uiConfig.analytics.amountField` for the best display; without them the UI falls back to humanised IDs and name-based amount detection.
- The token is still in `localStorage`; moving to an httpOnly cookie would require gateway changes (cookie auth + CSRF) and is left for later.
