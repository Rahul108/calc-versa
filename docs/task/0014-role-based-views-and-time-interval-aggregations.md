# Task 0014: Role-Based View Control & Time-Interval Aggregation Pipeline

## Summary
Implemented **Role-Based Access Control Scoping** in the frontend and a **Time-Interval Aggregation API Pipeline (`POST /apps/:id/aggregate`)** in the API Gateway to support multi-member expense tracking and interval summaries for Mess & Building tools.

## Scope & Changes
1. **API Gateway Aggregation API (`POST /apps/:id/aggregate`)**:
   - Aggregates `AppRecord` historical calculation logs across custom date ranges (`startDate`, `endDate`).
   - Summarizes total calculation runs, aggregated metric totals, and per-member breakdown data.

2. **Role-Based View Scoping (Frontend Navbar)**:
   - Queries authenticated user profile via `GET /auth/me`.
   - **Regular Member Users (`is_admin: false`)**: See ONLY **Tools Dashboard** (`/`) and **Tool Runner** (`/product?id=33`). `+ Create Tool` and `AI Copilot` navigation buttons are automatically hidden.
   - **Creator / Admin Users (`is_admin: true`)**: Granted full access (`+ Create Tool`, `AI Copilot`, `Edit Tool Config`).

3. **Time-Interval Summary Tab (`ProductToolPage.tsx`)**:
   - Added **"Member Summary & Time-Interval Analytics"** tab on `/product?id=<tool-id>`.
   - Displays time range filters, total calculation runs, aggregated revenue/bills, and per-member expense breakdown tables.
