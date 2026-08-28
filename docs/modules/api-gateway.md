# Module Documentation: API Gateway (Node.js / NestJS)

## Path
`backend/api-gateway-nodejs/`

## Tech Stack
- **Framework**: NestJS
- **Authentication**: Passport JWT (`@nestjs/jwt`, `@nestjs/passport`, `bcryptjs`)
- **ORM**: TypeORM (`@nestjs/typeorm`)
- **Language**: TypeScript
- **Port**: `3000` (default)
- **Dependencies**: `libs/db` (TypeORM Entities & DataSource)

---

## Core Responsibilities
1. **Entry Point Routing**: Receives all REST and WebSocket requests from `frontend/`.
2. **Authentication System**:
   - `POST /auth/register`: Hashes passwords with `bcryptjs` (salt rounds = 10) and registers user accounts.
   - `POST /auth/login`: Validates credentials and returns signed JWT access tokens.
   - `GET /auth/me`: Retrieves authenticated user profile.
3. **Multi-Tenant App Permission Authorization (`AppPermissionGuard`)**:
   - Uses `@RequireAppPermission('read' | 'write')` decorator.
   - Queries `UsersNAppMapping` and `UserPermission` (`libs/db/src/entities/`) to enforce strict user-to-app data isolation.
   - Denies any cross-tenant CRUD attempt with a `403 Forbidden` response.
4. **User Action Audit Logging (`LoggingInterceptor`)**:
   - Extracted `user.id` and `user.username` are logged in every structured JSON entry output to stdout and `logs/app-<date>.log`.

---

## Internal Code Structure
```
backend/api-gateway-nodejs/
├── src/
│   ├── auth/
│   │   ├── dto/                   # RegisterDto & LoginDto
│   │   ├── strategies/            # Passport JwtStrategy
│   │   ├── guards/                # JwtAuthGuard & AppPermissionGuard
│   │   ├── decorators/            # RequireAppPermission decorator
│   │   ├── auth.service.ts        # Bcrypt hashing & JWT signing
│   │   ├── auth.controller.ts     # /auth/register, /auth/login, /auth/me
│   │   └── auth.module.ts         # NestJS Auth configuration
│   ├── common/
│   │   ├── middleware/            # CorrelationIdMiddleware (x-correlation-id)
│   │   ├── interceptors/          # LoggingInterceptor with user action auditing
│   │   ├── filters/               # AllExceptionsFilter
│   │   └── logging/               # FileLogger (app-<date>.log & error-<date>.log)
│   ├── app.controller.ts          # Main request handlers
│   ├── app.module.ts              # Root module importing TypeOrmModule & AuthModule
│   └── main.ts                    # Application bootstrap file
```

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/architecture/data-model.md`
- `docs/guides/coding-standards-and-observability.md`
