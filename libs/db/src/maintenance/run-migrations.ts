/**
 * Structural subset of TypeORM's DataSource. Typed this way so services that resolve
 * their own `typeorm` copy (e.g. the API Gateway's node_modules) can pass theirs.
 */
export interface MigratableDataSource {
  options: { migrationsTableName?: string };
  query(sql: string, params?: unknown[]): Promise<any>;
  runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<Array<{ name: string }>>;
}

/** The first migration; databases created by `synchronize` already contain its schema. */
const BASELINE_MIGRATION = { timestamp: 1787934189939, name: 'SchemaUpdate1787934189939' };

/**
 * Runs pending migrations, first "baselining" databases that were built with
 * TypeORM `synchronize` (tables exist, but no migration history).
 *
 * Baseline rule: if the `migrations` table is empty and the `users` table already
 * exists, record the initial migration as applied. Later migrations are written
 * idempotently, so they apply cleanly on top.
 *
 * Returns the names of the migrations that ran.
 */
export async function runMigrationsWithBaseline(dataSource: MigratableDataSource): Promise<string[]> {
  const migrationsTable = dataSource.options.migrationsTableName ?? 'migrations';

  await dataSource.query(
    `CREATE TABLE IF NOT EXISTS "${migrationsTable}" (
      "id" SERIAL PRIMARY KEY,
      "timestamp" bigint NOT NULL,
      "name" character varying NOT NULL
    )`,
  );

  const [{ count }] = await dataSource.query(`SELECT COUNT(*)::int AS count FROM "${migrationsTable}"`);
  const [{ exists }] = await dataSource.query(
    `SELECT to_regclass('public.users') IS NOT NULL AS exists`,
  );

  if (count === 0 && exists) {
    await dataSource.query(
      `INSERT INTO "${migrationsTable}" ("timestamp", "name") VALUES ($1, $2)`,
      [BASELINE_MIGRATION.timestamp, BASELINE_MIGRATION.name],
    );
  }

  const executed = await dataSource.runMigrations({ transaction: 'each' });
  return executed.map((m) => m.name);
}
