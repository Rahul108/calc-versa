# 0010. Migration-Managed Schema & In-Database Record Analytics

- **Status**: Accepted
- **Date**: 2026-11-21
- **Deciders**: Core Engineering
- **Amends**: [ADR 0004](0004-migrate-from-prisma-to-typeorm.md) (schema sync), [ADR 0008](0008-generic-record-entry-and-multi-interval-analytics.md) (aggregation)

---

## Context & Problem Statement

From the audit ([task 0016](../task/0016-full-stack-code-audit.md)):

1. TypeORM `synchronize` was on in every non-production environment and `migrations: []` was empty, so the one existing migration never ran and was already behind the entities (`users.is_admin` was missing). Production had no reliable way to build or evolve the schema.
2. `POST /apps/:id/aggregate` loaded every record of an app into Node memory and aggregated in JavaScript — memory and latency grow linearly with history.

## Decision Outcome

### Schema: migrations everywhere
- `libs/db/src/data-source.ts` exports `dataSourceOptions` (entities + ordered `MIGRATIONS`), used by the API Gateway, the TypeORM CLI and the seed scripts. `synchronize` is off unless `DB_SYNCHRONIZE=true` (throwaway experiments only).
- The API Gateway runs pending migrations on start-up (`DatabaseMigrationService`, before `listen`); `DB_MIGRATIONS_RUN=false` hands this to a deploy step.
- **Baseline for legacy databases**: `runMigrationsWithBaseline` records the initial migration as applied when the `migrations` table is empty but `users` already exists (i.e. built by `synchronize`). Every later migration is idempotent (`IF NOT EXISTS` / `IF EXISTS`).
- Migration chain: `SchemaUpdate` (now creates `uuid-ossp`), `AddUserIsAdmin` (new), `AppOwnershipAndScopedNames` ([ADR 0009](0009-app-ownership-and-centralized-authorization.md)).

Verified: a fresh database migrated from zero and a legacy `synchronize`-built database both report **zero** differences against the entities (TypeORM schema builder diff).

### Analytics: aggregate in Postgres
- `RecordAnalyticsService` computes the whole aggregation response in one parameterised SQL query (CTEs + `jsonb_each` + `jsonb_object_agg`). The response shape is unchanged.
- Tools can declare field roles in `uiConfig.analytics` (`amountField`, `memberField`, `categoryField`). Without them the previous name-based heuristics are applied in SQL, so existing tools behave the same.
- Verified against the previous JavaScript implementation on seeded and edge-case data (numeric strings, multiple amount-like keys, results-only amounts, empty member names) across three date ranges: identical output except one intended fix — per-member payload totals no longer count boolean `true` as `1` (the overall totals never did).

### Why not the Python analysis service?
Moving the data to another service would add a network hop and a second database client for what is a single grouped query. The Python service keeps statistical work that SQL does poorly (it now computes real descriptive statistics; regression and batch jobs remain planned).

## Consequences
- Schema changes now require a migration; `synchronize` no longer hides drift.
- Developers with existing local databases need no action — the baseline happens automatically on the next gateway start.
- Aggregation cost moves to Postgres; the existing `(app_id, record_date)` index serves the filter.
