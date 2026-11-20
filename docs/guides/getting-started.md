# Getting Started Guide

This guide walks you through setting up and running **CalcVersa** locally.

---

## Prerequisites
- **Node.js**: `v18+` or `v20+`
- **Docker & Docker Compose**: Installed and running
- **Go**: `v1.22+` (for local Go compute service runs)
- **Python**: `v3.10+` (for Python analysis service)

---

## Local Development Setup

### 1. Clone & Install Dependencies
```bash
# Install NPM dependencies at monorepo root
npm install
```
The repo's `.npmrc` sets `legacy-peer-deps=true` (some ESLint plugins still declare older ESLint peers). Install `node_modules` on the machine you run it on: a tree copied from Linux lacks the macOS native binaries for Rollup/esbuild/Nx, and the Vite dev server fails with `Watcher is not a constructor`.

### 2. Start Database & Infrastructure
Create the Compose env file with a JWT signing secret (32+ characters; the file is gitignored):
```bash
cp infra/docker/.env.example infra/docker/.env
```
Set `JWT_SECRET` in it (e.g. the output of `openssl rand -hex 48`). Compose refuses to start the API Gateway without it.

Launch PostgreSQL and supporting containers using Docker Compose:
```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```
This starts PostgreSQL on port `5432` (database: `calcversa`, user: `calcversa_user`).

### 3. Verify Database Entities
The TypeORM DataSource is configured in `libs/db/src/data-source.ts`. The schema is managed by **migrations** (`libs/db/src/migrations/`) in every environment: the API Gateway applies pending migrations on start-up before it accepts requests. Databases previously built with `synchronize` are detected and baselined automatically (see [ADR 0010](../adr/0010-migration-managed-schema-and-sql-analytics.md)).

- Schema change: edit the entity, then add a migration (`npm run migration:generate -- src/migrations/<Name>` in `libs/db`) and register it in `MIGRATIONS` in `data-source.ts`.
- Apply migrations as a separate deploy step instead: set `DB_MIGRATIONS_RUN=false` on the gateway and run `npm run migration:run` in `libs/db`.
- Sample data: `npx ts-node -P libs/db/tsconfig.json libs/db/src/seeds/seed-expense-tracker.ts` (also applies migrations).

### 4. Run Development Servers via Nx

- **Run Frontend SPA**:
  ```bash
  npx nx serve frontend
  ```
  Access the frontend in your browser at `http://localhost:4200` or `http://localhost:3005`.

- **Run API Gateway (NestJS)**:
  ```bash
  cd backend/api-gateway-nodejs
  npm run start:dev
  ```

- **Run Go Compute Engine**:
  ```bash
  cd backend/compute-service-golang
  go run main.go
  ```

---

## Workspace Project Graph
Visualized with Nx CLI:
```bash
npx nx graph
```

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/guides/creating-a-calculator-tool.md`
- `infra/docker/docker-compose.yml`
