# ADR 0005: Introduce AI Assistant / Agent Microservice with Google Gemini API

## Status
**Accepted**

## Context
Users of CalcVersa need prompt-driven guidance, AI-assisted operations (such as finding tool information, updating dataset statuses, or marking items resolved), and on-demand report generation without cluttering core API gateway logic.

## Decision
We decided to add a dedicated microservice `backend/ai-assistant-service-nodejs` powered by **Google Gemini API** (`@google/genai`):

1. **Stack**: Node.js / NestJS, providing full TypeScript type safety, DTO validation, and symmetry with `backend/api-gateway-nodejs`.
2. **Endpoints**:
   - `POST /agent/guide`: Evaluates user prompts asking for guidance on how to perform operations. Instructs step-by-step guidance. If a requirement cannot be fulfilled properly, responds explicitly stating "No / Unable to perform request".
   - `POST /agent/operate`: Executes prompt-driven actions like status updates (`mark_resolved`) or search (`find_info`).
   - `GET|POST /agent/report`: Generates structured system and operational reports on demand.
3. **Environment Configuration**: Keys configured in `backend/ai-assistant-service-nodejs/.env.example` (`GEMINI_API_KEY`, `GEMINI_MODEL`).

## Consequences

### Positive:
- Decouples AI prompt evaluation and LLM interaction from primary user authentication and compute loops.
- Provides consistent, fallback-safe operational guidance and reporting.
- Easy deployment via Docker container (`infra/docker/ai-assistant-service-nodejs.Dockerfile`).

### Negative / Trade-offs:
- Requires managing an external API key (`GEMINI_API_KEY`) and quota management.
