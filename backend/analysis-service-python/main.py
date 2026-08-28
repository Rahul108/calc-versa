import os
import json
import logging
import time
import uuid
from datetime import datetime
from logging.handlers import TimedRotatingFileHandler
from fastapi import FastAPI, Request, Response
from pydantic import BaseModel

# Ensure logs directory exists
LOGS_DIR = os.path.join(os.getcwd(), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Custom JSON Log Formatter
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "service": "analysis-service-python",
            "message": record.getMessage(),
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
logger.setLevel(logging.INFO)

json_formatter = JSONFormatter()

# 1. Console Handler (stdout)
console_handler = logging.StreamHandler()
console_handler.setFormatter(json_formatter)
logger.addHandler(console_handler)

# 2. Daily Rotational App Handler (logs/app-YYYY-MM-DD.log)
app_log_filename = os.path.join(LOGS_DIR, f"app-{datetime.now().strftime('%Y-%m-%d')}.log")
app_file_handler = TimedRotatingFileHandler(app_log_filename, when="midnight", interval=1, backupCount=30)
app_file_handler.setFormatter(json_formatter)
app_file_handler.setLevel(logging.INFO)
logger.addHandler(app_file_handler)

# 3. Daily Rotational Error Handler (logs/error-YYYY-MM-DD.log)
error_log_filename = os.path.join(LOGS_DIR, f"error-{datetime.now().strftime('%Y-%m-%d')}.log")
error_file_handler = TimedRotatingFileHandler(error_log_filename, when="midnight", interval=1, backupCount=30)
error_file_handler.setFormatter(json_formatter)
error_file_handler.setLevel(logging.ERROR)
logger.addHandler(error_file_handler)

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
