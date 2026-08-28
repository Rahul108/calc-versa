# Task 0006: API Gateway Auth (`/auth`), Apps (`/apps`), and Records (`/records`) REST APIs

## Summary
Implemented core API Gateway REST endpoints for authentication (`/auth/register`, `/auth/login`), calculator tool management (`/apps`), and calculation submission logging (`/records`).

## Scope & Changes
- Created `AuthModule` with JWT and bcrypt password hashing.
- Created `AppsModule` for creating, updating, listing, and sharing calculation tools.
- Created `RecordsModule` for submission logging and date-range report queries (`startDate`, `endDate`).
- Mapped endpoints in OpenAPI Swagger UI (`http://localhost:3005/api/docs`).
