import { hashSync } from 'bcryptjs';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordAndSeedAdmin1775931348646 implements MigrationInterface {
  name = 'AddPasswordAndSeedAdmin1775931348646';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user_entity" ADD COLUMN "password" character varying
        `);

    await queryRunner.query(`
            INSERT INTO "user_entity" ("id", "username", "email", "password")
            VALUES (uuid_generate_v4(), 'admin', 'admin@oficina.com', '${hashSync('admin123', 10)}')
            ON CONFLICT ("email") DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "user_entity" WHERE "email" = 'admin@oficina.com'
        `);

    await queryRunner.query(`
            ALTER TABLE "user_entity" DROP COLUMN "password"
        `);
  }
}
