# Module Documentation: Frontend (React SPA)

## Path
`frontend/`

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS / PostCSS
- **Routing**: React Router DOM (`react-router-dom`)
- **Port**: `4200` / `3005`

---

## Core Responsibilities
1. **Dynamic Tool Rendering**: Reads tool ID parameters from URLs (`/product?id=33`), fetches field requirements from NestJS API Gateway (`backend/api-gateway-nodejs/`), and renders dynamic form controls.
2. **Interactive UI State**: Manages real-time form inputs, validation, and real-time result displays.
3. **User Dashboard**: Provides tool management UI for users to define tool requirements, manage access permissions, and generate public/private sharing links.

---

## Internal Code Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── app.tsx            # Main application router & layout component
│   │   ├── app.spec.tsx       # Component tests
│   │   └── nx-welcome.tsx     # Workspace landing component
│   ├── main.tsx               # DOM entrypoint
│   └── styles.css             # Global CSS & Tailwind imports
├── index.html                 # HTML template
├── vite.config.ts             # Vite server & build config
├── tailwind.config.js         # Tailwind utility styling config
└── project.json               # Nx project configuration
```

---

## Key Routing Patterns
- Root / Dashboard: `/`
- Account-Specific Product URL: `/product?id=:id` (e.g. `/product?id=33`)

---

## Related Documents
- `docs/architecture/overview.md`
- `docs/guides/creating-a-calculator-tool.md`
- `frontend/src/app/app.tsx`
