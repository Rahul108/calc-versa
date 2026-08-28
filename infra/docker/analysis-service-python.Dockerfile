FROM python:3.11-slim

WORKDIR /app

COPY backend/analysis-service-python/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/analysis-service-python ./

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
