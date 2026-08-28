# 0006. Integrate Swagger OpenAPI Documentation

- **Status**: Accepted
- **Date**: 2026-08-28
- **Context**: CalcVersa is a multi-tenant platform with polyglot microservices and dynamic calculation tools. Frontend developers, API consumers, and backend engineers require an interactive, self-documenting interface to discover endpoints, inspect request/response DTO schemas, and test JWT authentication without relying on external postman collections or manual docs.

---

## Decision
We decided to integrate **Swagger OpenAPI 3.0** into the NestJS API Gateway using `@nestjs/swagger` served at `/api/docs`.

### Key Implementation Details:
1. **Interactive UI (`http://localhost:3005/api/docs`)**: Serves an interactive Swagger UI interface.
2. **Bearer JWT Testing (`addBearerAuth()`)**: Enables direct token submission and API testing within the browser UI.
3. **DTO Schema Generation**: Uses `@ApiProperty()` annotations on DTO classes (`RegisterDto`, `LoginDto`) for request validation and schema rendering.

---

## Consequences

### Positive Impacts & Benefits:
- **Cleanliness & Maintenance**: API schemas are generated automatically from TypeScript code/DTOs. No separate static OpenAPI files to manually keep in sync.
- **Developer Experience**: Frontend developers can test endpoints directly from the browser at `http://localhost:3005/api/docs`.
- **Contract Transparency**: Clear visibility into mandatory request fields, error response payloads, and authorization requirements.

### Negative / Trade-offs:
- Requires small decorator annotations (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) on controllers and DTOs.

---

## Related ADRs
- `docs/adr/0002-polyglot-microservices.md`
- `docs/adr/0005-ai-assistant-agent-microservice.md`
