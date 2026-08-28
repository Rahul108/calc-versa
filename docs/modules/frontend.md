# Module Documentation: Frontend Application (React SPA)

## Path
`frontend/`

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Modern Vanilla CSS Design System with Glassmorphism
- **Routing**: React Router DOM (`react-router-dom`)
- **Port**: `4200` (Nx dev server)

---

## Core Responsibilities & Pages

1. **Tools Dashboard (`/` & `/tools`)**:
   - Displays all created calculator tools with search filtering, status tags, creation timestamps, and direct "Launch Tool" links.

2. **Dynamic Product Tool Runner (`/product?id=<tool-id>`)**:
   - Accessible via dedicated URLs (`http://localhost:4200/product?id=91956cd2-45e0-40f8-b378-c81fd2c3438d`).
   - Dynamically parses `inputsConfig.sections` rendering numbers, sliders (with real-time value pill badges), dropdowns, and checkboxes.
   - Triggers real-time formula computation via Go Compute Engine (`POST /apps/:id/calculate`) with `<2ms` response latency!

3. **Creative Tool Builder (`/create`)**:
   - Visual tool constructor allowing users to add sections, input fields (type, label, min/max, defaults), and formula expression rules with live side-by-side preview!

4. **AI Prompt Copilot (`/ai-copilot`)**:
   - User types plain English requirement prompts.
   - Evaluates tool feasibility (`POST /agent/feasibility`) using Google Gemini 2.5 Flash API.
   - Generates AI Dry-Run Draft Preview Cards with confidence scores and explicit 2-step "Approve & Instantiate Tool" button (`user_confirmed: true`).

5. **User Authentication (`/login`)**:
   - JWT authentication state management storing access token in `localStorage`.

---

## Key Page Routes

| Route | Component | Description |
| :--- | :--- | :--- |
| `/` or `/tools` | `DashboardPage.tsx` | Tools list dashboard with search & stats |
| `/product?id=:id` | `ProductToolPage.tsx` | Dynamic tool runner & real-time Go formula execution |
| `/create` | `CreateToolPage.tsx` | Visual tool constructor with live preview |
| `/ai-copilot` | `AiCopilotPage.tsx` | AI prompt copilot with 2-step tool creation |
| `/login` | `LoginPage.tsx` | User authentication page |

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/guides/creating-a-calculator-tool.md`
- `docs/task/0013-frontend-interactive-dashboard.md`
