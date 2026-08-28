# Event-Driven Architecture & Messaging

## Overview
While interactive tool calculations (e.g. at `/product?id=33`) use synchronous HTTP requests for low latency, **CalcVersa** incorporates an **Event-Driven Architecture** using **RabbitMQ** for asynchronous background operations, telemetry, and heavy batch processing.

The infrastructure setup for RabbitMQ is located in `infra/rabbitmq/` and orchestrated via Docker Compose (`infra/docker/docker-compose.yml`).

---

## Communication Patterns

```
+------------------+                    +---------------------+
|   React Client   |                    |  NestJS API Gateway |
+------------------+                    +---------------------+
         |                                         |
         | Synchronous REST                        | Publishes Event
         v                                         v
+------------------+                    +---------------------+
| Go Compute Engine|                    | RabbitMQ Message    |
| (Real-time math) |                    | Broker (AMPQ)       |
+------------------+                    +---------------------+
                                                   |
                                                   | Consumes Event
                                                   v
                                        +---------------------+
                                        | Python Analysis     |
                                        | Service (Batch/AI)  |
                                        +---------------------+
```

---

## Core Domain Events

| Event Name | Publisher | Consumer(s) | Description |
| :--- | :--- | :--- | :--- |
| `ToolCreatedEvent` | API Gateway | Analytics, Logger | Triggered when a user defines a new calculation tool. |
| `CalculationExecutedEvent` | Go Compute / API Gateway | Analysis Service | Publishes calculation metrics, inputs, and latency for reporting. |
| `BatchProcessingRequestedEvent` | API Gateway | Python Analysis Service | Dispatches long-running, multi-row calculation datasets. |
| `UserPermissionChangedEvent` | API Gateway | API Gateway Cache | Invalidates session permissions when tool access changes. |

---

## Message Broker Configuration
- **Broker**: RabbitMQ
- **Port**: `5672` (AMQP protocol), `15672` (Management UI)
- **Infrastructure Path**: `infra/rabbitmq/`
- **Compose Service**: `infra/docker/docker-compose.yml`

---

## Related Documents
- `docs/architecture/overview.md`
- `infra/rabbitmq/`
- `infra/docker/docker-compose.yml`
