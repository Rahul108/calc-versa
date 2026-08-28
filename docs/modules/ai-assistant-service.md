# Module Documentation: AI Assistant Microservice (Node.js / NestJS)

## Path
`backend/ai-assistant-service-nodejs/`

## Tech Stack
- **Framework**: NestJS
- **LLM Engine**: Google Gemini API (`@google/genai`)
- **Language**: TypeScript
- **Port**: `3004` (default)

---

## Core Responsibilities
1. **Prompt-driven Guidance (`POST /agent/guide`)**: Processes user prompts regarding CalcVersa operations. Instructs step-by-step guidance. If a query is unfulfillable or out of scope, responds explicitly with "No / Unable to perform".
2. **AI Operations (`POST /agent/operate`)**: Performs prompt-driven operations like searching info, updating statuses (`mark_resolved`), or executing operational tasks.
3. **Report Generation (`GET|POST /agent/report`)**: Generates usage and system health reports on demand.

---

## Environment Configuration
Configured in `.env` (derived from `.env.example`):
- `GEMINI_API_KEY`: API Key for Google Gemini API.
- `GEMINI_MODEL`: Gemini model version (default: `gemini-2.5-flash`).
- `PORT`: HTTP port (`3004`).

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/adr/0005-ai-assistant-agent-microservice.md`
- `backend/ai-assistant-service-nodejs/README.md`
