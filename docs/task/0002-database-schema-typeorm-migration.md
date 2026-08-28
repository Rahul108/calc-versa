# Task 0002: Database Schema Design & TypeORM Migration

## Summary
Migrated ORM strategy from Prisma to TypeORM (`docs/adr/0004-migrate-from-prisma-to-typeorm.md`). Implemented 6 core database entities (`User`, `App`, `UsersNAppMapping`, `Permission`, `UserPermission`, `AppRecord`) with PostgreSQL JSONB support.

## Scope & Changes
- Defined entity decorators in `libs/db/src/entities/`.
- Configured PostgreSQLDataSource and automatic schema synchronization (`synchronize: true` in dev).
- Added `is_admin` boolean flag to `User` entity.
- Added `AppRecord` entity for calculation submission logging.
