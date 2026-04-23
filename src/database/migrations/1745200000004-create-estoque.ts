import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEstoque1745200000004 implements MigrationInterface {
  name = 'CreateEstoque1745200000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "estoque" (
        "id" SERIAL NOT NULL,
        "pecas_insumos" character varying NOT NULL,
        "quantidade_fisica" integer NOT NULL DEFAULT 0,
        "quantidade_reservada" integer NOT NULL DEFAULT 0,
        "preco_unitario" numeric(10, 2) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_estoque" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "estoque"`);
  }
}
