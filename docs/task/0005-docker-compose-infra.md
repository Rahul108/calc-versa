# Task 0005: Docker Compose Single-Command Local Runtime Infrastructure

## Summary
Created unified Docker Compose architecture (`infra/docker/docker-compose.yml`) allowing the complete stack (PostgreSQL, RabbitMQ, API Gateway, Go Compute Engine) to run with live hot-reloading and zero local dependency setup.

## Scope & Changes
- Created Dockerfiles under `infra/docker/`.
- Configured bind-mounts for live code reloading and local log visibility.
- Set container node_modules isolation to avoid Linux kernel `EBUSY` mount locks.
