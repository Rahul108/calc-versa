# Bugfix Record: NestJS `--entryFile` Monorepo Compilation Path

- **Date**: 2026-08-28
- **Category**: NestJS & Monorepo Build
- **Severity**: High (Caused connection reset errors on HTTP API requests)

---

## Symptom
HTTP requests returned `curl: (56) Recv failure: Connection reset by peer`.
Container logs showed:
```
Error: Cannot find module '/app/backend/api-gateway-nodejs/dist/main'
```

---

## Root Cause
Because `backend/api-gateway-nodejs/src/app.module.ts` imports shared entities from `../../../libs/db/src`, TypeScript compiler places compiled output under `dist/backend/api-gateway-nodejs/src/main.js` instead of `dist/main.js`.
Nest CLI default `nest start --watch` looked for `dist/main.js`, resulting in `MODULE_NOT_FOUND`.

---

## Resolution
Updated `package.json` `start:dev` script in `backend/api-gateway-nodejs`:

```json
"scripts": {
  "start:dev": "nest start --watch --entryFile backend/api-gateway-nodejs/src/main"
}
```

---

## Verification
- Tested `POST /auth/register` -> Returned `201 Created`.
- Tested `POST /auth/login` -> Returned `201 Created` with signed JWT token.
- Tested `GET /auth/me` -> Returned `200 OK` with profile.
