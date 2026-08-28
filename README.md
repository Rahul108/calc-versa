# CalcVersa

> Multi-tenant, polyglot microservices platform enabling accounts to define custom calculation tool requirements and serve account-specific calculation tools under dedicated URLs (e.g. `http://localhost:4200/product?id=92b6dc26-9553-41fe-aab1-3fb1866b6916`).

---

## 100% Docker-Powered Architecture

No local runtime setup (Node.js, Go, Python, PostgreSQL, Nginx, RabbitMQ) is required! The entire polyglot backend stack and React SPA frontend run in **Docker Compose** with multi-stage builds and dedicated non-conflicting host ports.

### Start the Platform (Single Command)

Run the following command from the project root to start all microservices and the frontend in Docker:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

To stop all containers:
```bash
docker compose -f infra/docker/docker-compose.yml down
```

---

## Local Service Directory & Active Container URLs

| Application / Microservice | Local Host URL | Container Name | Description |
| :--- | :--- | :--- | :--- |
| **React Frontend SPA** | **`http://localhost:4200/`** | `calcversa-frontend` | Production Nginx container serving React SPA |
| ↳ **Tools Dashboard** | **`http://localhost:4200/`** | `calcversa-frontend` | Manage, search, and launch calculation tools |
| ↳ **Dynamic Tool Runner** | **`http://localhost:4200/product?id=<id>`** | `calcversa-frontend` | Dedicated product URL with dynamic inputs & <0.2ms Go math execution |
| ↳ **AI Prompt Copilot** | **`http://localhost:4200/ai-copilot`** | `calcversa-frontend` | Natural language prompt-to-tool generator with Gemini 2.5 Flash |
| ↳ **Creative Tool Builder** | **`http://localhost:4200/create`** | `calcversa-frontend` | Visual form field constructor with live preview |
| **Admin Management Panel** | **`http://localhost:3005/admin`** | `calcversa-api-gateway` | Super-Admin management console to inspect & edit database entities |
| **API Gateway & Swagger UI** | **`http://localhost:3005/api/docs`** | `calcversa-api-gateway` | REST APIs & interactive OpenAPI documentation (`/auth`, `/apps`, `/records`) |
| **AI Assistant Microservice** | **`http://localhost:3006/agent/feasibility`** | `calcversa-ai-assistant` | AI guidance, safety guardrails, and RAG tool generation |
| **Go Compute Engine** | **`http://localhost:8085/health`** | `calcversa-compute-service` | Real-time mathematical formula evaluation engine (<0.2ms) |
| **RabbitMQ Dashboard** | **`http://localhost:15675`** | `calcversa-rabbitmq` | Event broker management console (`guest` / `guest`) |
| **PostgreSQL Database** | **`localhost:5435`** | `calcversa-postgres` | PostgreSQL DB (`calcversa_user` / `calcversa_pass` / `calcversa`) |

---

## Accessing the Admin Management Panel

The Admin Panel at `http://localhost:3005/admin` requires an account with **`is_admin = true`**.

### How to Promote a User to Admin:

Run this command from your terminal to promote any registered user account (e.g., `johndoe`) to Admin:

```bash
docker exec -it calcversa-postgres psql -U calcversa_user -d calcversa -c "UPDATE users SET is_admin = true WHERE username = 'johndoe';"
```

---

## Database Initialization & Schema Synchronization

When running via Docker Compose in `development` mode, TypeORM **Auto-Synchronization (`synchronize: true`)** is enabled.
- All 6 database tables (`users`, `apps`, `users_n_app_mappings`, `permissions`, `user_permissions`, `app_records`) and indexes are **automatically created** in PostgreSQL on startup.

---

## Container Log Access

Log files stream directly inside container volumes:

- **API Gateway**: `./backend/api-gateway-nodejs/logs/`
- **AI Assistant**: `./backend/ai-assistant-service-nodejs/logs/`
- **Compute Engine**: `./backend/compute-service-golang/logs/`
