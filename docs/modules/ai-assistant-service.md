# Module Documentation: AI Assistant Microservice (Node.js / NestJS)

## Path
`backend/ai-assistant-service-nodejs/`

## Tech Stack
- **Framework**: NestJS
- **LLM Engine**: Google Gemini API (`@google/generative-ai`)
- **Language**: TypeScript
- **Port**: `3001` (Host Port `3006`)

---

## Core Responsibilities & RAG Endpoints

1. **Tool Feasibility Analysis & Dry-Run (`POST /agent/feasibility`)**:
   - Analyzes user requirement prompt against system capabilities (`inputsConfig` controls & `formulaConfig` math rules).
   - Runs `Formula Expression Sanitizer` (`common/sanitizer.ts`) blocking code injection.
   - Enforces `confidence >= 0.85` and returns dry-run draft schema with `requires_user_confirmation: true`.

2. **Confirmed Prompt-to-Tool Creation (`POST /agent/create-tool`)**:
   - Requires `user_confirmed: true` flag. Builds `CreateAppDto` and instantiates the tool via API Gateway (`POST /apps`).

3. **Confirmed Prompt-to-Tool Modification (`POST /agent/update-tool`)**:
   - Requires `user_confirmed: true` flag. Fetches existing tool schema (`GET /apps/:id`), merges modifications using Gemini, and updates tool (`PUT /apps/:id`).

4. **Step-by-Step Guidance (`POST /agent/guide`)**:
   - Provides step-by-step guidance. Responds explicitly with *"No. This operation cannot be fulfilled by CalcVersa."* for unsupported prompts.

---

## Zero-Trust Safety Guardrails
- **2-Step Explicit Human Confirmation**: Database creation and updates are **NEVER** executed automatically without `user_confirmed: true`.
- **Formula Expression Sanitizer**: Validates expressions against a whitelist of arithmetic operators (`+`, `-`, `*`, `/`, `^`, `**`, `()`) and registered input fields.
- **Git Secret Protection**: Local `.env` secrets protected by root `.gitignore` rules (`.env*`, `*.env`).

---

## Environment Configuration
Template provided in `.env.example`:
- `GEMINI_API_KEY`: Secret API Key for Google Gemini.
- `API_GATEWAY_URL`: Base URL for API Gateway (`http://localhost:3005`).
- `PORT`: Service port (`3001`).

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/adr/0005-ai-assistant-agent-microservice.md`
- `docs/task/0012-ai-rag-pipeline-tool-operations.md`
