# Troubleshooting & Bugfix Directory

This directory contains detailed technical resolution records for operational issues, container compilation locks, database errors, and debugging workflows in **CalcVersa**.

---

## Bugfix Records Index

| Record ID | Issue Summary | Category | Status |
| :--- | :--- | :--- | :--- |
| **[0001](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/bugfix/0001-typeorm-decorator-cli-error.md)** | TypeORM Migration CLI `TS1240` Property Decorator Compilation Error | Database & TypeORM CLI | **Resolved** |
| **[0002](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/bugfix/0002-docker-ebusy-rmdir-lock.md)** | Docker Container `EBUSY: resource busy or locked, rmdir` | Docker Containerization | **Resolved** |
| **[0003](file:///home/aninda-sarker-rahul/Documents/Personal/projects/calc-versa/docs/bugfix/0003-nest-entryfile-compilation-path.md)** | NestJS `--entryFile` Monorepo Compilation Path (`MODULE_NOT_FOUND`) | NestJS Build System | **Resolved** |

---

## Common Operational Troubleshooting

### 1. Database Connection Failures
- **Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:5432`.
- **Fix**: Verify PostgreSQL container status (`docker ps -f name=calcversa-postgres`). Host port is `5435`, container internal port is `5432`.

### 2. Tool Authorization Denial (403 Forbidden on `/product?id=33`)
- **Symptom**: 403 Forbidden despite valid login.
- **Fix**: Inspect `users_n_app_mappings` or `user_permissions` table for the logged-in user ID and `app_id = "33"`.

---

## Related Documents
- `docs/guides/getting-started.md`
- `docs/guides/coding-standards-and-observability.md`
- `infra/docker/docker-compose.yml`
