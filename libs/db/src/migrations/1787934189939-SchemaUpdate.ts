import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1787934189939 implements MigrationInterface {
    name = 'SchemaUpdate1787934189939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "read" boolean NOT NULL DEFAULT false, "write" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "permission_id" uuid NOT NULL, "app_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_008506cf4aecc03b62ba3820f55" UNIQUE ("user_id", "permission_id", "app_id"), CONSTRAINT "PK_01f4295968ba33d73926684264f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "apps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "status" boolean NOT NULL DEFAULT true, "inputsConfig" jsonb, "formulaConfig" jsonb, "uiConfig" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c1a24df1d51c2748d97561b77da" UNIQUE ("name"), CONSTRAINT "PK_c5121fda0f8268f1f7f84134e19" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users_n_app_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "app_id" uuid NOT NULL, "user_id" uuid NOT NULL, "status" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_053553875cd660c6ac8847546b7" UNIQUE ("user_id", "app_id"), CONSTRAINT "PK_17d388d18974630bc1001c30871" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "address" character varying NOT NULL, "contact_no" character varying NOT NULL, "email" character varying NOT NULL, "status" boolean NOT NULL DEFAULT true, "password" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "app_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "app_id" uuid NOT NULL, "user_id" uuid NOT NULL, "payload" jsonb NOT NULL, "results" jsonb, "record_date" date NOT NULL DEFAULT ('now'::text)::date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1d4f64f0af0cce0026e72a6ccd8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_app_records_user" ON "app_records" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_app_records_app_date" ON "app_records" ("app_id", "record_date") `);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_8145f5fadacd311693c15e41f10" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_3dd5c8a30a36eb6a3cf953c953d" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users_n_app_mappings" ADD CONSTRAINT "FK_b962c485bd04880ac6a891ec0c9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users_n_app_mappings" ADD CONSTRAINT "FK_134253b4501aab1cb75566378a7" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_records" ADD CONSTRAINT "FK_da1d5eb1f4d6fb68a14d05ce1b6" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app_records" ADD CONSTRAINT "FK_9754c04dbc8772149070f7d6436" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "app_records" DROP CONSTRAINT "FK_9754c04dbc8772149070f7d6436"`);
        await queryRunner.query(`ALTER TABLE "app_records" DROP CONSTRAINT "FK_da1d5eb1f4d6fb68a14d05ce1b6"`);
        await queryRunner.query(`ALTER TABLE "users_n_app_mappings" DROP CONSTRAINT "FK_134253b4501aab1cb75566378a7"`);
        await queryRunner.query(`ALTER TABLE "users_n_app_mappings" DROP CONSTRAINT "FK_b962c485bd04880ac6a891ec0c9"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3dd5c8a30a36eb6a3cf953c953d"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8145f5fadacd311693c15e41f10"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8"`);
        await queryRunner.query(`DROP INDEX "public"."idx_app_records_app_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_app_records_user"`);
        await queryRunner.query(`DROP TABLE "app_records"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "users_n_app_mappings"`);
        await queryRunner.query(`DROP TABLE "apps"`);
        await queryRunner.query(`DROP TABLE "user_permissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
