# ADR 0007: Integrate AdminJS Automated Administration Panel

- **Status**: Accepted
- **Date**: 2026-08-28
- **Context**: CalcVersa requires a dedicated management administration panel accessible only to super-admin accounts (`is_admin === true`) to configure, inspect, and manage all database entities (`User`, `App`, `UsersNAppMapping`, `Permission`, `UserPermission`, `AppRecord`).

---

## Decision Rationale

We selected **AdminJS** (`@adminjs/nestjs` + `@adminjs/typeorm`) as the administration panel solution for the following reasons:

1. **Auto-Generated UI**: AdminJS automatically inspects TypeORM entities and generates full interactive CRUD views, search filters, and JSON viewers without manual React/HTML coding.
2. **In-Process Package**: AdminJS runs directly inside the Node.js API Gateway runtime (`/admin`) without requiring external cloud SaaS or extra microservice instances.
3. **Role-Based Security**: Secured with an `is_admin: true` authentication check so standard tenant users cannot access administrative views.
4. **JSON Config Support**: Built-in JSON view editors support CalcVersa's complex JSONB fields (`inputsConfig`, `formulaConfig`, `uiConfig`, `payload`, `results`).

---

## Consequences

- Super-admins can access the admin panel at `http://localhost:3005/admin`.
- Non-admin users are denied access to `/admin`.
- All database modifications performed via AdminJS automatically trigger TypeORM entity hooks and database constraints.
