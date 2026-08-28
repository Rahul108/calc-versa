# Module Documentation: API Gateway (Node.js / NestJS)

## Path
`backend/api-gateway-nodejs/`

## Tech Stack
- **Framework**: NestJS
- **ORM**: TypeORM (`@nestjs/typeorm`)
- **Language**: TypeScript
- **Port**: `3000` (default)
- **Dependencies**: `libs/db` (TypeORM Entities & DataSource)

---

## Core Responsibilities
1. **Entry Point Routing**: Receives all REST and WebSocket requests from `frontend/`.
2. **Authentication & Authorization**: Validates JWT session tokens and user identity.
3. **Multi-Tenant Tool Access Control**: Uses TypeORM repositories (`UsersNAppMapping`, `UserPermission`) to ensure users can only access or modify their authorized calculation tools.
4. **Metadata Management**: Serves dynamic tool configurations (`inputsConfig`, `formulaConfig`, `uiConfig`), field metadata, and user preferences.

---

## Internal Code Structure
```
backend/api-gateway-nodejs/
├── src/
│   ├── app.controller.ts     # Main request handlers & root routes
│   ├── app.module.ts         # Main NestJS module with TypeOrmModule configuration
│   ├── app.service.ts        # Core business logic methods
│   └── main.ts               # Application bootstrap file
├── test/                     # End-to-End & Integration tests
├── package.json              # Service scripts & dependencies
└── tsconfig.json             # TypeScript configuration
```

---

## Key Integration Points
- **Database**: Imports TypeORM entities from `libs/db/src`.
- **Go Compute Engine**: Proxies real-time formula evaluation requests to `backend/compute-service-golang/`.
- **RabbitMQ**: Publishes audit events (`ToolCreatedEvent`, `CalculationExecutedEvent`) to `infra/rabbitmq/`.

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/architecture/data-model.md`
- `backend/api-gateway-nodejs/src/app.module.ts`
