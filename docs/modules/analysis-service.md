# Module Documentation: Analysis Service (Python)

## Path
`backend/analysis-service-python/`

## Tech Stack
- **Language**: Python 3.10+
- **Container**: `infra/docker/analysis-service-python.Dockerfile`

---

## Current Capabilities
- `GET /health` — liveness, echoes `x-correlation-id`.
- `POST /analysis/process` — descriptive statistics over a list of numbers:
  ```json
  { "dataset_id": "optional label", "values": [2, 4, 4, 5], "metrics": ["mean", "median", "std_dev", "p90"] }
  ```
  Metrics: `count`, `sum`, `mean`, `median`, `min`, `max`, `std_dev` and `variance` (sample), `p25`, `p75`, `p90` (linear interpolation). `metrics` defaults to all. Empty or non-finite `values` and unknown metrics return 422. (This endpoint used to return the constant `{mean: 42.5, stdDev: 1.2}`.)
- Logs: structured JSON to stdout and `logs/app-YYYY-MM-DD.log` / `logs/error-YYYY-MM-DD.log`, switching files at midnight (same naming as the other services).

## Planned
1. Regression models and longer-running analytics over calculation records.
2. Batch processing of calculation events from RabbitMQ (`infra/rabbitmq/`).
3. Report exports (PDF, CSV).

Record aggregation for the tool analytics tab runs in Postgres from the API Gateway (see [ADR 0010](../adr/0010-migration-managed-schema-and-sql-analytics.md)), not here.

---

## Internal Code Structure
```
backend/analysis-service-python/
├── main.py               # FastAPI app, logging, statistics
├── test_main.py          # pytest suite
├── requirements.txt
└── requirements-dev.txt  # + pytest, httpx
```

Run tests: `pip install -r requirements-dev.txt && pytest -q`

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/architecture/event-driven.md`
- `infra/docker/analysis-service-python.Dockerfile`
