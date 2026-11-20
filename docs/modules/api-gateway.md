# Module Documentation: API Gateway (Node.js / NestJS)

## Path
`backend/api-gateway-nodejs/`

## Tech Stack
- **Framework**: NestJS
- **Authentication**: Passport JWT (`@nestjs/jwt`, `@nestjs/passport`, `bcryptjs`)
- **OpenAPI**: Swagger UI (`@nestjs/swagger`)
- **ORM**: TypeORM (`@nestjs/typeorm`)
- **Language**: TypeScript
- **Port**: `3000` (internal container port) / `3005` (exposed host port)
- **Dependencies**: `libs/db` (TypeORM Entities & DataSource)

---

## Core Responsibilities
1. **Entry Point Routing**: Receives all REST and WebSocket requests from `frontend/`.
2. **Authentication System**:
   - `POST /auth/register`: Hashes passwords with `bcryptjs` (salt rounds = 10) and registers user accounts.
   - `POST /auth/login`: Validates credentials and returns signed JWT access tokens.
   - `GET /auth/me`: Retrieves authenticated user profile.
3. **Calculator Tool Template Management (`/apps`)**:
   - `POST /apps`: Create a new calculator tool (`inputsConfig`, `formulaConfig`, `uiConfig`) & auto-assign ownership.
   - `GET /apps`: List tools accessible to the logged-in user.
   - `GET /apps/:id`: Retrieve tool metadata and schema configs (`@RequireAppPermission('read')`).
   - `PUT /apps/:id`: Update tool configurations (`@RequireAppPermission('write')`).
   - `DELETE /apps/:id`: Delete tool instance (`@RequireAppPermission('owner')`).
   - `POST /apps/:id/share`: Share access with another user account (`targetUsernameOrEmail`, `read`, `write`) (`@RequireAppPermission('owner')`).
4. **App Records & Report Data Logging (`/records`)**:
   - `POST /records`: Submit daily user inputs (`payload`) and calculated outputs (`results`) (`@RequireAppPermission('write')`).
   - `GET /records`: Query date-range records for weekly/monthly/yearly reports (`app_id`, `startDate`, `endDate`, optional `mine=true`) (`@RequireAppPermission('read')`). Returns all of the app's records, like `GET /apps/:id/records`; `mine=true` narrows to the caller's own.
   - `POST /apps/:id/aggregate`: Totals and per-member/category/day/month breakdowns, computed in a single Postgres query (`RecordAnalyticsService`). Field roles can be set per tool in `uiConfig.analytics` (`amountField`, `memberField`, `categoryField`); otherwise name-based heuristics apply.
   - `GET /records/:id`: Retrieve specific calculation record.
   - `DELETE /records/:id`: Delete calculation record.
5. **User Permission & Access Control Management (`/permissions` & `/apps/:id/permissions`)**:
   - `GET /permissions/me`: List all calculator tool permission grants for the logged-in user across all tools.
   - `GET /apps/:id/permissions`: List all user access grants and read/write permission levels for an app (`@RequireAppPermission('owner')`).
   - `PUT /apps/:id/permissions/:userId`: Update user read/write access level for an app (`@RequireAppPermission('owner')`).
   - `DELETE /apps/:id/permissions/:userId`: Revoke a user's access mapping for an app (`@RequireAppPermission('owner')`).
6. **Multi-Tenant App Permission Authorization (`AppPermissionGuard`)**:
   - Uses `@RequireAppPermission('read' | 'write' | 'owner')` decorator; decisions live in `AppAccessService` (see [ADR 0009](../adr/0009-app-ownership-and-centralized-authorization.md)).
   - App ID comes from the route `:id` when present, else `app_id` in body/query (conflicting values → 400).
   - `owner` (`UsersNAppMapping.is_owner`) is required to share, manage permissions or delete; a mapping without permission rows is read-only.
   - Queries `UsersNAppMapping` and `UserPermission` (`libs/db/src/entities/`) to enforce strict user-to-app data isolation.
   - Denies any cross-tenant CRUD attempt with a `403 Forbidden` response.
7. **User Action Audit Logging (`LoggingInterceptor`)**:
   - Extracted `user.id` and `user.username` are logged in every structured JSON entry output to stdout and `logs/app-<date>.log`.

---

## Internal Code Structure
```
backend/api-gateway-nodejs/
├── src/
│   ├── auth/                      # Register, Login, JWT Strategy & Guards
│   ├── apps/                      # Calculator Tool CRUD, DTOs & Sharing
│   ├── records/                   # Submissions Log & Date-Range Querying
│   ├── permissions/               # User Access Control & Permission Grants
│   │   ├── dto/                   # UpdateUserPermissionDto
│   │   ├── permissions.service.ts # Access level updates & revocation
│   │   ├── permissions.controller.ts # /permissions endpoints with Swagger annotations
│   │   └── permissions.module.ts  # Permissions module configuration
│   ├── common/                    # Middleware, Interceptors, Filters, FileLogger
│   ├── app.controller.ts          # Main request handlers
│   ├── app.module.ts              # Root module importing Auth, Apps, Records, Permissions
│   └── main.ts                    # Application bootstrap & Swagger UI setup
```

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/architecture/data-model.md`
- `docs/guides/coding-standards-and-observability.md`
