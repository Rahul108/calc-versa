import json
import logging
import time
import uuid
from typing import Optional
from fastapi import FastAPI, Request, Response
from pydantic import BaseModel

# Custom JSON Log Formatter
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "service": "analysis-service-python",
            "message": record.getMessage(),
            "caller": f"{record.filename}:{record.lineno}",
        }
        if hasattr(record, "correlation_id"):
            log_obj["correlation_id"] = record.correlation_id
        if hasattr(record, "request_meta"):
            log_obj["request"] = record.request_meta
        if record.exc_info:
            log_obj["error"] = {"stack": self.formatException(record.exc_info)}
        return json.dumps(log_obj)

# Setup Logger
logger = logging.getLogger("analysis-service")
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

app = FastAPI(title="CalcVersa Python Analysis Service")

CORRELATION_ID_HEADER = "x-correlation-id"

@app.middleware("http")
async def correlation_id_and_logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    correlation_id = request.headers.get(CORRELATION_ID_HEADER) or request.headers.get("x-request-id") or str(uuid.uuid4())
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
        }
    }
    
    logger.info(f"{request.method} {request.url.path} {response.status_code} - {duration_ms}ms", extra=extra)
    return response

@app.get("/health")
async def health(request: Request):
    return {
        "status": "ok",
        "service": "analysis-service-python",
        "correlationId": getattr(request.state, "correlation_id", "N/A"),
    }

class AnalysisRequest(BaseModel):
    dataset_id: str
    metrics: list[str]

@app.post("/analysis/process")
async def process_analysis(req: AnalysisRequest, request: Request):
    return {
        "status": "success",
        "datasetId": req.dataset_id,
        "results": {"mean": 42.5, "stdDev": 1.2},
        "service": "analysis-service-python",
        "correlationId": getattr(request.state, "correlation_id", "N/A"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
