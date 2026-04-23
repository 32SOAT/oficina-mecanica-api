import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItemOsEstoque1745200000008 implements MigrationInterface {
  name = 'CreateItemOsEstoque1745200000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "item_os_estoque" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "os_id" uuid NOT NULL,
        "estoque_id" integer NOT NULL,
        "quantidade" integer NOT NULL,
        "preco_aplicado" numeric(10, 2) NOT NULL,
        "disponivel_no_diagnostico" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_item_os_estoque" PRIMARY KEY ("id"),
        CONSTRAINT "FK_item_os_estoque_ordem_servico" FOREIGN KEY ("os_id") REFERENCES "ordem_servico" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_item_os_estoque_estoque" FOREIGN KEY ("estoque_id") REFERENCES "estoque" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_item_os_estoque_os_id" ON "item_os_estoque" ("os_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_item_os_estoque_estoque_id" ON "item_os_estoque" ("estoque_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_item_os_estoque_estoque_id"`);
    await queryRunner.query(`DROP INDEX "IDX_item_os_estoque_os_id"`);
    await queryRunner.query(`DROP TABLE "item_os_estoque"`);
  }
}
