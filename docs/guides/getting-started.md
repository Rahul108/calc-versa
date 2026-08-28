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

### 2. Start Database & Infrastructure
Launch PostgreSQL and supporting containers using Docker Compose:
```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```
This starts PostgreSQL on port `5432` (database: `calcversa`, user: `calcversa_user`).

### 3. Verify Database Entities
The TypeORM DataSource is configured in `libs/db/src/data-source.ts`. In development mode (`NODE_ENV !== 'production'`), TypeORM automatically synchronizes database tables with your entities upon starting the API gateway.

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
