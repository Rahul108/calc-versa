# CalcVersa

> Multi-tenant, polyglot microservices platform enabling accounts to define custom calculation tools and serve account-specific tools under dedicated URLs (e.g. `http://localhost:3005/product?id=33`).

---

## Recommended Execution: Run via Docker Only

No local runtime setup (Node.js, Go, Python, PostgreSQL, RabbitMQ) is required. The entire backend stack runs in Docker Compose with **live code hot-reloading**, **local log file streaming**, and **dedicated non-conflicting host ports**.

### Start the Platform

Run the following command from the project root:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

To stop all services:
```bash
docker compose -f infra/docker/docker-compose.yml down
```

---

## Browsing APIs & Services Locally

| Service / Interface | Local Host URL | Description |
| :--- | :--- | :--- |
| **API Gateway & Swagger UI** | **`http://localhost:3005/api/docs`** | Interactive OpenAPI documentation & Auth APIs (`/auth/register`, `/auth/login`) |
| **AI Assistant Microservice** | **`http://localhost:3006/health`** | AI guidance, operations (`/agent/operate`), and reporting |
| **Go Compute Engine** | **`http://localhost:8085/health`** | Real-time mathematical formula evaluation engine (<2ms) |
| **Python Analysis Service** | **`http://localhost:8005/health`** | Statistical data processing & analytics engine |
| **RabbitMQ Dashboard** | **`http://localhost:15675`** | Event broker management console (`guest`/`guest`) |
| **PostgreSQL Database** | **`localhost:5435`** | PostgreSQL DB (`calcversa_user` / `calcversa_pass` / `calcversa`) |

---

## Running Frontend Locally

```bash
# Start the React SPA Frontend
npx nx serve frontend
```

The frontend will be accessible at `http://localhost:4200` (or `http://localhost:4300`).

---

## Local Log File Access

Rotational log files (`app-<date>.log` and `error-<date>.log`) written inside Docker containers stream directly to your local project folders:

- **API Gateway**: `./backend/api-gateway-nodejs/logs/`
- **AI Assistant**: `./backend/ai-assistant-service-nodejs/logs/`
- **Compute Engine**: `./backend/compute-service-golang/logs/`
- **Analysis Service**: `./backend/analysis-service-python/logs/`
