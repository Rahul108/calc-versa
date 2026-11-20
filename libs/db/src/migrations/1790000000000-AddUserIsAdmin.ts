import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * users.is_admin was added to the entity after the initial migration and only ever
 * reached databases through `synchronize`. Idempotent for those databases.
 */
export class AddUserIsAdmin1790000000000 implements MigrationInterface {
  name = 'AddUserIsAdmin1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_admin"`);
  }
}
