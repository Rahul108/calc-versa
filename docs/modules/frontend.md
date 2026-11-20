# Module Documentation: Frontend Application (React SPA)

## Path
`frontend/`

## Tech Stack
- **Framework**: React 18, TypeScript (strict)
- **Build Tool**: Vite (route-level code splitting via `React.lazy`)
- **Styling**: Vanilla CSS design system in `src/styles.css`. Light theme: warm-gray background, white cards, near-black text and primary buttons, one coral→pink accent (`--accent`, `--accent-2`) for highlights, focus rings and charts. Font: Geist / Geist Mono. Tokens live in `:root`; layout utilities (`.page`, `.stack`, `.row`, `.grid-2`, `.grid-form`), surfaces (`.card`), buttons (`.btn-primary`, `.btn-accent`, `.btn-secondary`, `.btn-ghost`), `.chip` filters, segmented `.tabs`, `.bar` / `.columns-chart` for analytics. Tailwind is configured but not used.
- **Icons**: `components/Icon.tsx` (small inline SVG set, no dependency); `components/ToolIcon.tsx` gives each tool a stable coloured monogram.
- **Routing**: React Router DOM
- **Tests**: Jest + Testing Library (`npx jest -c frontend/jest.config.js`), Playwright e2e in `frontend-e2e/`

## Configuration
API base URLs are read at build time:

| Variable | Default |
| :--- | :--- |
| `VITE_API_GATEWAY_URL` | `http://localhost:3005` |
| `VITE_AI_ASSISTANT_URL` | `http://localhost:3006` |

Set them in `frontend/.env.local` (template: `frontend/.env.example`) or as Docker build args (`infra/docker/.env`). The gateway's `CORS_ORIGINS` must include the origin the SPA is served from.

---

## Structure
```
frontend/src/app/
├── app.tsx                  # Routes, lazy pages, AuthProvider
├── auth/                    # AuthContext (session), RequireAuth / RequireAdmin
├── config/                  # Build-time URLs (env.ts; Jest uses env.test-stub.ts)
├── services/http.ts         # apiFetch: token, error messages, 401 handling
├── services/api.ts          # Typed endpoint functions
├── hooks/useAsync.ts        # Loading / error / reload for API calls
├── lib/fields.ts            # inputsConfig normalisation, defaults, payload validation
├── lib/format.ts            # Number / money / date helpers
├── components/              # Navbar, DynamicField, Feedback (Loading/Error/Empty/Alert)
├── pages/                   # Dashboard, Login, CreateTool, AiCopilot
└── pages/product/           # ProductToolPage + FormEntryTab, RecordsTab, AnalyticsTab
```

## Behaviour
- **Session**: the JWT is kept in `localStorage` and validated with `GET /auth/me` on load. Any 401, or reaching the token's `exp`, logs the user out and returns them to `/login`; after logging in they go back to the page they wanted (including `?id=`).
- **No placeholder data**: failed requests show the server's error with a retry button. The UI never substitutes mock tools, records or results.
- **Access-aware tool page**: `GET /apps/:id` includes `access` (`read` / `write` / `owner`). Read-only users can calculate but not save, and don't see delete buttons.
- **Field types**: `number`, `slider`, `select` (also accepts `dropdown`), `checkbox`, `text`, `date`. Number fields are validated client-side and sent as numbers.
- **Tool metadata used by the UI** (`uiConfig`): `toolType` (`tracker` saves every entry; otherwise calculate on demand), `currency`, `summaryMetrics[0].label`, `analytics.amountField`. `formulaConfig.outputs[]` gives result labels and `format` (`currency`, `percent`, `number`).
- **Creator pages** (`/create`, `/ai-copilot`) are shown only to admins. The API itself allows any signed-in user to create tools.

---

## Routes

| Route | Component | Access |
| :--- | :--- | :--- |
| `/` | `pages/DashboardPage.tsx` | Signed in |
| `/product?id=:id` | `pages/product/ProductToolPage.tsx` | Signed in + app access |
| `/create` | `pages/CreateToolPage.tsx` | Admin |
| `/ai-copilot` | `pages/AiCopilotPage.tsx` | Admin |
| `/login` | `pages/LoginPage.tsx` | Public |

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/guides/creating-a-calculator-tool.md`
- `docs/task/0013-frontend-interactive-dashboard.md`
- `docs/task/0019-frontend-fixes.md`
- `docs/adr/0011-frontend-session-and-data-loading.md`
