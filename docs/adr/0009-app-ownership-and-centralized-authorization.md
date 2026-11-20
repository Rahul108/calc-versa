# 0009. App Ownership Role & Centralized Authorization

- **Status**: Accepted
- **Date**: 2026-11-20
- **Deciders**: Core Engineering

---

## Context & Problem Statement

The full-stack audit ([task 0016](../task/0016-full-stack-code-audit.md)) found that app-level authorization could be bypassed and that the permission model had no notion of ownership:

1. `AppPermissionGuard` read the app ID from `query.id` before the route param, while controllers acted on the route param — `PUT /apps/<victim>?id=<mine>` was authorized against the caller's own app.
2. `GET`/`DELETE /records/:id` had no app-level check at all.
3. Any user with `write` could share, grant `write`, revoke the creator, or delete the app. A mapping with no permission rows silently granted `write`.
4. The AI Assistant service accepted unauthenticated requests.
5. JWT signing used a hard-coded fallback secret.

## Decision Outcome

1. **One authorization service.** `AppAccessService` (`backend/api-gateway-nodejs/src/auth/app-access.service.ts`) is the only place that decides access. `AppPermissionGuard` and record-level checks both call it; it is exported by `AppAccessModule`.
2. **Unambiguous app ID resolution.** If the route has `:id`/`:appId`, that is the app. Otherwise `app_id` from body or query, and conflicting values are rejected with 400. `query.id` / `body.id` are no longer read.
3. **Three permission levels.** `read` (view, calculate), `write` (edit config and records, save calculation records), `owner` (share, manage permissions, delete the app).
   - Ownership is a new column `users_n_app_mappings.is_owner`, set when an app is created. Owners cannot be changed or revoked via the permissions APIs.
   - A mapping with no `UserPermission` rows is now read-only.
4. **Tool names are unique per owner**, not globally (dropped `UNIQUE(apps.name)`), so name collisions no longer reveal other tenants' tools.
5. **AI Assistant delegates authentication to the API Gateway.** `GatewayAuthGuard` verifies the caller's Bearer token with `GET /auth/me` (60s cache) and always forwards that same token; the AI service never holds the JWT secret, preserving service boundaries ([ADR 0002](0002-polyglot-microservices.md), [ADR 0005](0005-ai-assistant-agent-microservice.md)).
6. **No default JWT secret.** `getJwtSecret()` requires a 32+ character `JWT_SECRET` in production, and uses a random per-process secret (with a warning) elsewhere. Docker Compose reads it from the gitignored `infra/docker/.env`.

## Migration

`libs/db/src/migrations/1795132800000-AppOwnershipAndScopedNames.ts` adds the column, backfills one owner per app (earliest active mapping) and drops the unique constraint. It is idempotent. (Originally the gateway also ran the backfill at start-up because dev databases used `synchronize`; since [ADR 0010](0010-migration-managed-schema.md) the gateway runs migrations instead.)

## Consequences

- **Behaviour change**: users who previously had write via a bare mapping now have read only; non-owners with `write` can no longer share, manage permissions or delete. Existing apps get the earliest mapped user as owner.
- **Clients** of the AI Assistant service must send `Authorization: Bearer <token>` on every call (the frontend now does).
- **Login rate limiting** is in-memory per gateway instance; with multiple replicas it must move to a shared store.
