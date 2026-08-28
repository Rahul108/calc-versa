# Troubleshooting & Bugfix Guide

This document contains solutions for common operational issues, database connection errors, container failures, and debugging steps.

---

## 1. Database Connection Failures

### Symptom
API Gateway or TypeORM startup fails with:
`Error: connect ECONNREFUSED 127.0.0.1:5432`

### Troubleshooting Steps
1. Verify PostgreSQL container status:
   ```bash
   docker ps -f name=calcversa-db
   ```
2. If container is stopped, restart via Docker Compose:
   ```bash
   docker-compose -f infra/docker/docker-compose.yml up -d
   ```
3. Verify database environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

---

## 2. TypeORM Entity Metadata Reflection Error

### Symptom
NestJS startup fails with:
`No metadata for "User" was found` or `Reflect.hasOwnMetadata is not a function`.

### Fix
Ensure `import 'reflect-metadata';` is at the very top of `libs/db/src/data-source.ts` and `main.ts`, and that `"experimentalDecorators": true` and `"emitDecoratorMetadata": true` are enabled in `tsconfig.base.json`.

---

## 3. Tool Authorization Denial (403 Forbidden on `/product?id=33`)

### Symptom
Visiting product URL returns 403 Forbidden despite valid login.

### Root Cause
Missing entry in `users_n_app_mappings` or `user_permissions` table for the logged-in user ID and `app_id = "33"`.

### Fix
Query PostgreSQL database to inspect user permission mapping:
```sql
SELECT * FROM users_n_app_mappings WHERE user_id = 'user-uuid' AND app_id = '33';
```
Ensure `status` is set to `true`.

---

## 4. Go Compute Service Build Errors

### Symptom
`go run main.go` fails to resolve dependencies.

### Fix
Tidy Go modules inside `backend/compute-service-golang/`:
```bash
cd backend/compute-service-golang
go mod download
go mod tidy
```

---

## Related Documents
- `docs/guides/getting-started.md`
- `libs/db/src/entities/`
- `infra/docker/docker-compose.yml`
