import { MigrationInterface, QueryRunner } from 'typeorm';
import { BACKFILL_APP_OWNERS_SQL } from '../maintenance/backfill-app-owners';

/**
 * - Adds users_n_app_mappings.is_owner and backfills one owner per app.
 * - Drops the global UNIQUE("name") on apps; names are now unique per owner.
 *
 * Written idempotently so it is safe on databases already altered by `synchronize`.
 */
export class AppOwnershipAndScopedNames1795132800000 implements MigrationInterface {
  name = 'AppOwnershipAndScopedNames1795132800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_n_app_mappings" ADD COLUMN IF NOT EXISTS "is_owner" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(BACKFILL_APP_OWNERS_SQL);
    await queryRunner.query(
      `ALTER TABLE "apps" DROP CONSTRAINT IF EXISTS "UQ_c1a24df1d51c2748d97561b77da"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "apps" ADD CONSTRAINT "UQ_c1a24df1d51c2748d97561b77da" UNIQUE ("name")`,
    );
    await queryRunner.query(`ALTER TABLE "users_n_app_mappings" DROP COLUMN IF EXISTS "is_owner"`);
  }
}
