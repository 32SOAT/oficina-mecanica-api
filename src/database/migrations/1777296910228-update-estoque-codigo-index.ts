import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEstoqueCodigoIndex1777296910228
  implements MigrationInterface
{
  name = 'UpdateEstoqueCodigoIndex1777296910228';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "estoque" DROP CONSTRAINT IF EXISTS "UQ_estoque_codigo"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_estoque_codigo"
      ON "estoque" ("codigo")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_estoque_codigo"`);

    await queryRunner.query(`
      ALTER TABLE "estoque"
      ADD CONSTRAINT "UQ_estoque_codigo" UNIQUE ("codigo")
    `);
  }
}
