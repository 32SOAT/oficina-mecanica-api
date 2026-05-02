import { hashSync } from 'bcryptjs';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordAndSeedAdmin1775931348646 implements MigrationInterface {
  name = 'AddPasswordAndSeedAdmin1775931348646';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hashedPassword = hashSync('admin123', 10);
    await queryRunner.query(
      `INSERT INTO "usuario" ("id", "username", "email", "password")
             VALUES (uuid_generate_v4(), 'admin', 'admin@oficina.com', $1)
             ON CONFLICT ("email") DO NOTHING`,
      [hashedPassword],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "usuario" WHERE "email" = 'admin@oficina.com'`,
    );
  }
}
