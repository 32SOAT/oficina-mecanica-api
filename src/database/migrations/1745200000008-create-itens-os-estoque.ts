import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItensOsEstoque1745200000008 implements MigrationInterface {
  name = 'CreateItensOsEstoque1745200000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "itens_os_estoque" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "os_id" uuid NOT NULL,
        "estoque_id" integer NOT NULL,
        "quantidade" integer NOT NULL,
        "preco_aplicado" numeric(10, 2) NOT NULL,
        "disponivel_no_diagnostico" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_itens_os_estoque" PRIMARY KEY ("id"),
        CONSTRAINT "FK_itens_os_estoque_ordem" FOREIGN KEY ("os_id") REFERENCES "ordens_servicos" ("id"),
        CONSTRAINT "FK_itens_os_estoque_estoque" FOREIGN KEY ("estoque_id") REFERENCES "estoque" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_itens_os_estoque_os_id" ON "itens_os_estoque" ("os_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_itens_os_estoque_estoque_id" ON "itens_os_estoque" ("estoque_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_itens_os_estoque_estoque_id"`);
    await queryRunner.query(`DROP INDEX "IDX_itens_os_estoque_os_id"`);
    await queryRunner.query(`DROP TABLE "itens_os_estoque"`);
  }
}
