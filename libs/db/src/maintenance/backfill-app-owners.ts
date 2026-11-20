/**
 * Marks the earliest active mapping of every app that has no owner as its owner.
 *
 * Idempotent: apps that already have an owner are untouched. Used by the
 * AppOwnershipAndScopedNames migration.
 */
export const BACKFILL_APP_OWNERS_SQL = `
UPDATE "users_n_app_mappings" m
SET "is_owner" = true
WHERE m."id" IN (
  SELECT DISTINCT ON (x."app_id") x."id"
  FROM "users_n_app_mappings" x
  WHERE x."status" = true
    AND NOT EXISTS (
      SELECT 1 FROM "users_n_app_mappings" o
      WHERE o."app_id" = x."app_id" AND o."is_owner" = true
    )
  ORDER BY x."app_id", x."created_at" ASC
)`;
