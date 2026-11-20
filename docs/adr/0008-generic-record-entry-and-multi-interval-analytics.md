# 0008. Generic Form Entry & Multi-Interval Analytics Engine

- **Status**: Accepted
- **Date**: 2026-08-29
- **Deciders**: Architecture Team, Core Engineering

---

## Context & Problem Statement

CalcVersa was initially designed around single-calculation ad-hoc tools (e.g., mortgage or profit calculators where inputs are provided, computed in real-time, and optionally saved). However, real-world requirements demand supporting **record-entry / form-logging tools**—such as multi-user daily expense trackers, mess meal distribution logs, attendance trackers, and time sheets—where individual users log discrete entries over time, view log history tables, and analyze multi-interval aggregated summaries (Daily, Weekly, Monthly, Per-User breakdown).

Hardcoding tool-specific tables or service endpoints for each tool type violates CalcVersa's vision of being a dynamic, metadata-driven platform.

---

## Decision Outcome

We decided to implement a **Generic Form Entry & Multi-Interval Analytics Architecture**:

1. **Metadata-Driven Tool Modality (`App.uiConfig.toolType`)**:
   - Tools specify `toolType: "tracker" | "calculator"`.
   - `inputsConfig` dynamically configures input form controls (`text`, `number`, `select`, `date` with `today` default, `user_select` / member picker).

2. **JSONB Record Persistence (`AppRecord`)**:
   - Each form entry is persisted in `AppRecord` containing `app_id`, `user_id`, `record_date` (YYYY-MM-DD), `payload` (JSONB input values), and `results` (JSONB formula results).

3. **Generic Multi-Interval Aggregation API (`POST /apps/:id/aggregate`)**:
   - Accepts customizable date filters (`startDate`, `endDate`).
   - Dynamically computes overall numeric totals, per-member breakdowns (grouped by `user_id` or `payload.member_name`), category breakdowns (grouped by select field `expense_type`), and daily/weekly/monthly time-series aggregations without hardcoded column dependencies.

4. **Generic Frontend Rendering Engine (`ProductToolPage.tsx`)**:
   - Provides three unified tabs:
     - **Tab 1 (`Form Entry`)**: Generic dynamic form submission.
     - **Tab 2 (`Logged Records Table`)**: Filterable data grid with record deletion capabilities.
     - **Tab 3 (`Summarized Analytics`)**: Metric cards, per-member tables, category breakdown pills, and daily/monthly interval tables.

---

## Consequences

### Positive
- **Zero Tool-Specific Hardcoding**: Any tracker (Expense Tracker, Mess Tracker, Inventory Log) can be created purely via JSON specs.
- **Scalable Aggregations**: Supports multi-user daily logging and interval-based metrics across any date range.
- **Unified UI/UX**: Seamless experience between instant calculators and continuous form logging tools.

### Negative / Trade-Offs
- JSONB aggregation queries require standard TypeORM array processing in Node.js for complex nested payloads, but performance remains under 15ms for typical tool datasets.
