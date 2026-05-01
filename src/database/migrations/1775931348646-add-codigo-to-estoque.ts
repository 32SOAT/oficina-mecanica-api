import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCodigoToEstoque1775931348646 implements MigrationInterface {
  name = 'AddCodigoToEstoque1775931348646';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "estoque"
      ADD COLUMN "codigo" character varying NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "estoque"
      ADD CONSTRAINT "UQ_estoque_codigo" UNIQUE ("codigo")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "estoque" DROP CONSTRAINT "UQ_estoque_codigo"
    `);

    await queryRunner.query(`
      ALTER TABLE "estoque" DROP COLUMN "codigo"
    `);
  }
}
