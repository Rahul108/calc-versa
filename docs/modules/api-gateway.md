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
   - `DELETE /apps/:id`: Delete tool instance (`@RequireAppPermission('write')`).
   - `POST /apps/:id/share`: Share access with another user account (`targetUsernameOrEmail`, `read`, `write`).
4. **App Records & Report Data Logging (`/records`)**:
   - `POST /records`: Submit daily user inputs (`payload`) and calculated outputs (`results`) (`@RequireAppPermission('write')`).
   - `GET /records`: Query date-range records for weekly/monthly/yearly reports (`app_id`, `startDate`, `endDate`) (`@RequireAppPermission('read')`).
   - `GET /records/:id`: Retrieve specific calculation record.
   - `DELETE /records/:id`: Delete calculation record.
5. **Multi-Tenant App Permission Authorization (`AppPermissionGuard`)**:
   - Uses `@RequireAppPermission('read' | 'write')` decorator.
   - Queries `UsersNAppMapping` and `UserPermission` (`libs/db/src/entities/`) to enforce strict user-to-app data isolation.
   - Denies any cross-tenant CRUD attempt with a `403 Forbidden` response.
6. **User Action Audit Logging (`LoggingInterceptor`)**:
   - Extracted `user.id` and `user.username` are logged in every structured JSON entry output to stdout and `logs/app-<date>.log`.

---

## Internal Code Structure
```
backend/api-gateway-nodejs/
├── src/
│   ├── auth/                      # Register, Login, JWT Strategy & Guards
│   ├── apps/                      # Calculator Tool CRUD, DTOs & Sharing
│   │   ├── dto/                   # CreateAppDto, UpdateAppDto, ShareAppDto
│   │   ├── apps.service.ts        # App CRUD & UserPermission management
│   │   ├── apps.controller.ts     # /apps endpoints with Swagger annotations
│   │   └── apps.module.ts         # Apps module configuration
│   ├── records/                   # Submissions Log & Date-Range Querying
│   │   ├── dto/                   # CreateRecordDto, QueryRecordsDto
│   │   ├── records.service.ts     # AppRecord CRUD & Date range queries
│   │   ├── records.controller.ts   # /records endpoints with Swagger annotations
│   │   └── records.module.ts       # Records module configuration
│   ├── common/                    # Middleware, Interceptors, Filters, FileLogger
│   ├── app.controller.ts          # Main request handlers
│   ├── app.module.ts              # Root module importing TypeOrmModule, Auth, Apps, Records
│   └── main.ts                    # Application bootstrap & Swagger UI setup
```

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/architecture/data-model.md`
- `docs/guides/coding-standards-and-observability.md`
