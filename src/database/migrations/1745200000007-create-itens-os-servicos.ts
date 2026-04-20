import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItensOsServicos1745200000007 implements MigrationInterface {
  name = 'CreateItensOsServicos1745200000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "itens_os_servicos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "os_id" uuid NOT NULL,
        "servico_id" integer NOT NULL,
        "quantidade" integer NOT NULL,
        "preco_aplicado" numeric(10, 2) NOT NULL,
        "disponivel_no_diagnostico" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_itens_os_servicos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_itens_os_servicos_ordem" FOREIGN KEY ("os_id") REFERENCES "ordens_servicos" ("id"),
        CONSTRAINT "FK_itens_os_servicos_servico" FOREIGN KEY ("servico_id") REFERENCES "servicos" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_itens_os_servicos_os_id" ON "itens_os_servicos" ("os_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_itens_os_servicos_servico_id" ON "itens_os_servicos" ("servico_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_itens_os_servicos_servico_id"`);
    await queryRunner.query(`DROP INDEX "IDX_itens_os_servicos_os_id"`);
    await queryRunner.query(`DROP TABLE "itens_os_servicos"`);
  }
}
