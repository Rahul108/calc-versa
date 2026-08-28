# CalcVersa AI Assistant / Agent Microservice

## Overview
This NestJS microservice provides prompt-driven guidance, AI-assisted operations, and reporting capabilities for CalcVersa using the **Google Gemini API**.

---

## API Endpoints

### 1. `POST /agent/guide`
- **Request Body**: `{ "prompt": "How do I create a new calculation tool for loan payments?" }`
- **Response**: Step-by-step guidance instructions. If the query cannot be fulfilled or is outside CalcVersa capabilities, responds with `"No. This operation cannot be fulfilled."`.

### 2. `POST /agent/operate`
- **Request Body**: `{ "action": "mark_resolved", "targetId": "item-123", "details": "Mark calc tool #123 issue as resolved" }`
- **Response**: Status of operation, updated entity state, or summary result.

### 3. `GET /agent/report` & `POST /agent/report`
- **Query / Body**: `{ "reportType": "usage_summary" }`
- **Response**: Structured operational summary or system metrics report.

---

## Environment Variables
Configured in `.env` (refer to `.env.example`):
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `GEMINI_MODEL`: Model name (default: `gemini-2.5-flash`).
- `PORT`: Service port (default: `3004`).
