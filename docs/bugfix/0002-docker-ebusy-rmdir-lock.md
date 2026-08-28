# Bugfix Record: Docker Container `EBUSY: resource busy or locked, rmdir`

- **Date**: 2026-08-28
- **Category**: Docker & Containerization
- **Severity**: High (Blocked NestJS API Gateway startup in Docker)

---

## Symptom
NestJS container logs showed:
```
Error EBUSY: resource busy or locked, rmdir '/app/backend/api-gateway-nodejs/dist'
```

---

## Root Cause
In `nest-cli.json`, `"deleteOutDir": true` was set. When Nest CLI runs `nest start --watch`, Nest CLI attempts to execute `rmdir` on the `dist` directory before compiling.
However, inside Docker when `/app/backend/api-gateway-nodejs/dist` is a mounted directory or volume point, Linux kernel blocks `rmdir` on active volume mount points, throwing `EBUSY: resource busy or locked`.

---

## Resolution
Updated `nest-cli.json` in NestJS services:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": false
  }
}
```

Setting `"deleteOutDir": false` configures Nest CLI to overwrite compiled files incrementally without attempting to delete the root volume mount folder.

---

## Verification
Restarted container via `docker compose restart api-gateway`. Container booted cleanly with zero `EBUSY` errors.
