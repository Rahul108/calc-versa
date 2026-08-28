# Data Model & Multi-Tenancy Design

## Overview
The domain data model for **CalcVersa** is implemented using **TypeORM** in `libs/db/src/entities/`. It is structured to support multi-tenant isolation, account-specific calculation tools, and granular access control.

---

## Entity Relationship Diagram

```
+------------------+         +-----------------------+         +------------------+
|       User       |         |   UsersNAppMapping    |         |       App        |
+------------------+         +-----------------------+         +------------------+
| id (UUID)        |<-------1| id (UUID)             |1------->| id (UUID)        |
| username         |         | user_id (FK)          |         | name             |
| email            |         | app_id (FK)           |         | description      |
| status           |         | status                |         | status           |
+------------------+         +-----------------------+         | inputsConfig     |
         ^                                                     | formulaConfig    |
         |                   +-----------------------+         | uiConfig         |
         |                   |    UserPermission     |         +------------------+
         +------------------1| id (UUID)             |1-----------------+
                             | user_id (FK)          |
                             | app_id (FK)           |
                             | permission_id (FK)    |
                             +-----------------------+
                                         |
                                         v
                             +-----------------------+
                             |      Permission       |
                             +-----------------------+
                             | id (UUID)             |
                             | name                  |
                             | read (Boolean)        |
                             | write (Boolean)       |
                             +-----------------------+
```

---

## TypeORM Entities

### 1. `User` Entity (`libs/db/src/entities/User.entity.ts`)
Represents user accounts registered on the platform. Stores credentials, contact details, account status, and `OneToMany` relations to `UsersNAppMapping` and `UserPermission`.

### 2. `App` Entity (`libs/db/src/entities/App.entity.ts`)
Represents an individual calculation tool definition.
- `inputsConfig` (`jsonb`): Dynamic form field definitions, variable names, validation rules.
- `formulaConfig` (`jsonb`): Calculation logic and expressions evaluated by the Go compute engine.
- `uiConfig` (`jsonb`): Layout, themes, and labels for dedicated product URLs (`/product?id=33`).

### 3. `UsersNAppMapping` Entity (`libs/db/src/entities/UsersNAppMapping.entity.ts`)
Provides many-to-many relationship mapping between `User` accounts and `App` instances with a `@Unique(['user_id', 'app_id'])` constraint.

### 4. `Permission` & `UserPermission` Entities (`libs/db/src/entities/Permission.entity.ts`, `libs/db/src/entities/UserPermission.entity.ts`)
Enables fine-grained access governance. Specifies `read` and `write` permissions per user for specific `App` tool instances.

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/adr/0003-account-specific-tool-schema.md`
- `libs/db/src/data-source.ts`
