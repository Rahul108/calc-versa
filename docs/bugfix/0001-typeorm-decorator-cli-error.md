# Bugfix Record: TypeORM Migration CLI `TS1240` Decorator Error

- **Date**: 2026-08-28
- **Category**: Database & TypeORM CLI
- **Severity**: Medium (Blocked migration file generation)

---

## Symptom
Running `npm --prefix libs/db run migration:generate` failed with:
```
Error: Unable to open file: ".../libs/db/src/data-source.ts". ⨯ Unable to compile TypeScript:
src/entities/User.entity.ts:14:4 - error TS1240: Unable to resolve signature of property decorator when called as an expression.
```

---

## Root Cause
`libs/db/` was missing a dedicated `tsconfig.json` configuring `ts-node` decorator metadata. When `typeorm-ts-node-commonjs` ran in `libs/db`, `ts-node` defaulted to standard TypeScript without enabling decorator reflection metadata.

---

## Resolution
Created `libs/db/tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "CommonJS",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"]
}
```

---

## Verification
Executed migration generation command:
```bash
npm --prefix libs/db run migration:generate -- src/migrations/SchemaUpdate
```
- **Result**: `Exit code 0` (Migration generated successfully).
