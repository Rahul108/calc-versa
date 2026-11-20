import json
import logging
import math
import os
import statistics
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional

from fastapi import FastAPI, Request, Response
from pydantic import BaseModel, Field, field_validator

SERVICE_NAME = "analysis-service-python"
CORRELATION_ID_HEADER = "x-correlation-id"
LOGS_DIR = os.environ.get("LOGS_DIR", os.path.join(os.getcwd(), "logs"))


# ---------------------------------------------------------------------------
# Structured JSON logging (docs/guides/coding-standards-and-observability.md)
# ---------------------------------------------------------------------------
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "level": record.levelname,
            "service": SERVICE_NAME,
            "message": record.getMessage(),
        }
        if hasattr(record, "correlation_id"):
            log_obj["correlation_id"] = record.correlation_id
        if hasattr(record, "request_meta"):
            log_obj["request"] = record.request_meta
        if record.exc_info:
            log_obj["error"] = {"stack": self.formatException(record.exc_info)}
        return json.dumps(log_obj)


class DailyFileHandler(logging.Handler):
    """Writes to <dir>/<prefix>-YYYY-MM-DD.log, switching files when the date changes.

    Same naming as the Node and Go services. (TimedRotatingFileHandler kept the
    start-up date in the file name and appended a suffix on rotation instead.)
    """

    def __init__(self, directory: str, prefix: str, level=logging.NOTSET):
        super().__init__(level)
        self.directory = directory
        self.prefix = prefix
        self._date: Optional[str] = None
        self._stream = None
        self._lock = threading.Lock()
        os.makedirs(directory, exist_ok=True)

    def emit(self, record):
        try:
            line = self.format(record)
            today = datetime.now().strftime("%Y-%m-%d")
            with self._lock:
                if self._stream is None or self._date != today:
                    if self._stream is not None:
                        self._stream.close()
                    path = os.path.join(self.directory, f"{self.prefix}-{today}.log")
                    self._stream = open(path, "a", encoding="utf-8")
                    self._date = today
                self._stream.write(line + "\n")
                self._stream.flush()
        except Exception:  # pragma: no cover - logging must never raise
            self.handleError(record)

    def close(self):
        with self._lock:
            if self._stream is not None:
                self._stream.close()
                self._stream = None
        super().close()


def build_logger() -> logging.Logger:
    log = logging.getLogger("analysis-service")
    log.setLevel(logging.INFO)
    log.handlers.clear()
    formatter = JSONFormatter()

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    log.addHandler(console)

    app_file = DailyFileHandler(LOGS_DIR, "app", logging.INFO)
    app_file.setFormatter(formatter)
    log.addHandler(app_file)

    error_file = DailyFileHandler(LOGS_DIR, "error", logging.ERROR)
    error_file.setFormatter(formatter)
    log.addHandler(error_file)
    return log


logger = build_logger()

app = FastAPI(title="CalcVersa Python Analysis Service")


@app.middleware("http")
async def correlation_id_and_logging_middleware(request: Request, call_next):
    start_time = time.time()
    correlation_id = (
        request.headers.get(CORRELATION_ID_HEADER)
        or request.headers.get("x-request-id")
        or str(uuid.uuid4())
    )
    request.state.correlation_id = correlation_id

    response: Response = await call_next(request)

    duration_ms = round((time.time() - start_time) * 1000, 2)
    response.headers[CORRELATION_ID_HEADER] = correlation_id
    extra = {
        "correlation_id": correlation_id,
        "request_meta": {
            "method": request.method,
            "url": str(request.url),
            "origin_ip": request.client.host if request.client else "127.0.0.1",
            "user_agent": request.headers.get("user-agent", "Unknown"),
            "duration_ms": duration_ms,
            "status_code": response.status_code,
        },
    }
    msg = f"{request.method} {request.url.path} {response.status_code} - {duration_ms}ms"
    if response.status_code >= 400:
        logger.error(msg, extra=extra)
    else:
        logger.info(msg, extra=extra)
    return response


@app.get("/health")
async def health(request: Request):
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "correlationId": getattr(request.state, "correlation_id", "N/A"),
    }


# ---------------------------------------------------------------------------
# Descriptive statistics
# ---------------------------------------------------------------------------
Metric = Literal[
    "count", "sum", "mean", "median", "min", "max",
    "std_dev", "variance", "p25", "p75", "p90",
]
ALL_METRICS: List[str] = list(Metric.__args__)  # type: ignore[attr-defined]
MAX_VALUES = 100_000


class AnalysisRequest(BaseModel):
    dataset_id: Optional[str] = Field(None, max_length=200, description="Caller-side label echoed back")
    values: List[float] = Field(..., min_length=1, max_length=MAX_VALUES)
    metrics: Optional[List[Metric]] = Field(None, description="Defaults to all metrics")

    @field_validator("values")
    @classmethod
    def values_must_be_finite(cls, values: List[float]) -> List[float]:
        if any(not math.isfinite(v) for v in values):
            raise ValueError("values must be finite numbers")
        return values


def percentile(sorted_values: List[float], p: float) -> float:
    """Linear interpolation between closest ranks (same as numpy's default)."""
    if len(sorted_values) == 1:
        return sorted_values[0]
    rank = (len(sorted_values) - 1) * p
    lower = math.floor(rank)
    upper = math.ceil(rank)
    weight = rank - lower
    return sorted_values[lower] * (1 - weight) + sorted_values[upper] * weight


def compute_metrics(values: List[float], metrics: List[str]) -> Dict[str, float]:
    ordered = sorted(values)
    n = len(values)
    calculators = {
        "count": lambda: float(n),
        "sum": lambda: math.fsum(values),
        "mean": lambda: statistics.fmean(values),
        "median": lambda: statistics.median(ordered),
        "min": lambda: ordered[0],
        "max": lambda: ordered[-1],
        # Sample statistics; a single value has no spread.
        "std_dev": lambda: statistics.stdev(values) if n > 1 else 0.0,
        "variance": lambda: statistics.variance(values) if n > 1 else 0.0,
        "p25": lambda: percentile(ordered, 0.25),
        "p75": lambda: percentile(ordered, 0.75),
        "p90": lambda: percentile(ordered, 0.90),
    }
    return {m: calculators[m]() for m in metrics}


@app.post("/analysis/process")
async def process_analysis(req: AnalysisRequest, request: Request):
    metrics = list(dict.fromkeys(req.metrics)) if req.metrics else ALL_METRICS
    return {
        "status": "success",
        "datasetId": req.dataset_id,
        "results": compute_metrics(req.values, metrics),
        "service": SERVICE_NAME,
        "correlationId": getattr(request.state, "correlation_id", "N/A"),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
