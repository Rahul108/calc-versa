# ADR 0004: Migrate from Prisma ORM to TypeORM

## Status
**Accepted**

## Context
CalcVersa was initially scaffolded using Prisma ORM in `libs/db`. However, the core vision of CalcVersa requires users to define custom calculation tool requirements, which often involve dynamic SQL generation, complex programmatic query chaining, multi-table joining, and flexible reporting aggregations.

Prisma's query engine relies on static JSON object literals (`findMany`, `include`), which makes dynamic query building and complex SQL operations cumbersome or dependent on raw SQL strings (`$queryRaw`).

## Decision
We decided to completely remove **Prisma ORM** and transition the domain persistence layer (`libs/db`) to **TypeORM**:

1. **Entity Definition**: Created TypeORM entity classes in `libs/db/src/entities/` (`User`, `App`, `UsersNAppMapping`, `Permission`, `UserPermission`).
2. **Dynamic Query Capabilities**: Leverage TypeORM's fluent `QueryBuilder` for programmatic query construction, dynamic WHERE/HAVING clause chaining, and custom SQL expressions.
3. **JSON Column Support**: Stored custom input parameters, formula expressions, and UI layout metadata in `jsonb` columns (`inputsConfig`, `formulaConfig`, `uiConfig`) on the `App` entity.
4. **NestJS Integration**: Wired `TypeOrmModule.forRoot()` into the API Gateway (`backend/api-gateway-nodejs/src/app.module.ts`).

## Consequences

### Positive:
- **Full QueryBuilder Power**: Programmatic construction of complex, multi-condition queries for dynamic reports and custom tool filters.
- **Native NestJS Integration**: First-class support via `@nestjs/typeorm`.
- **JSONB Flexibility**: Native PostgreSQL JSONB support with TypeORM metadata.

### Negative / Trade-offs:
- Class decorator setup (`@Entity()`, `@Column()`) requires TypeScript `experimentalDecorators` and `emitDecoratorMetadata`.
- Schema changes require managing TypeORM entity classes and migration files instead of a single `.prisma` schema file.
