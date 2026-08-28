# ADR 0003: Account-Specific Calculation Tool Data Model & Routing

## Status
**Accepted**

## Context
The core product goal of CalcVersa is allowing users/accounts to construct custom calculation tool requirements and expose each calculation tool under a dedicated URL (e.g. `http://localhost:3005/product?id=33`).

This requires:
1. Isolating calculation tool definitions per user account.
2. Granting granular read/write permissions per tool.
3. Enabling dynamic rendering on the frontend via product ID query parameters or path parameters.
4. Supporting dynamic query building for dynamic reports and filters.

## Decision
We decided to implement the relational model using **TypeORM** in `libs/db/src/entities/`:

1. **`App` Entity**: Each calculation tool instance is stored as a record in the `App` table, including `inputsConfig`, `formulaConfig`, and `uiConfig` JSONB columns.
2. **`UsersNAppMapping` Join Entity**: Establishes explicit ownership and access mapping between a `User` account and an `App` calculation tool instance with a `@Unique(['user_id', 'app_id'])` constraint.
3. **`UserPermission` Scope**: Stores permission records (`Permission`) linking `(user_id, app_id, permission_id)`.
4. **URL Query Routing**: The frontend (`frontend/src/app/app.tsx`) uses URL parameters (e.g. `/product?id=33`) to load and render the corresponding `App` configuration.

## Consequences

### Positive:
- TypeORM `QueryBuilder` provides full flexibility for dynamic SQL queries and report filters.
- Strong security and data isolation per user account.
- Direct alignment between database `App.id` and frontend product URL `id`.

### Negative / Trade-offs:
- Requires TypeScript decorator metadata configuration in `libs/db/package.json`.
