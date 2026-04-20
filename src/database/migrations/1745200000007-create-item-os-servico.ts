import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItemOsServico1745200000007 implements MigrationInterface {
  name = 'CreateItemOsServico1745200000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "item_os_servico" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "os_id" uuid NOT NULL,
        "servico_id" integer NOT NULL,
        "quantidade" integer NOT NULL,
        "preco_aplicado" numeric(10, 2) NOT NULL,
        "disponivel_no_diagnostico" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_item_os_servico" PRIMARY KEY ("id"),
        CONSTRAINT "FK_item_os_servico_ordem_servico" FOREIGN KEY ("os_id") REFERENCES "ordem_servico" ("id"),
        CONSTRAINT "FK_item_os_servico_servico" FOREIGN KEY ("servico_id") REFERENCES "servico" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_item_os_servico_os_id" ON "item_os_servico" ("os_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_item_os_servico_servico_id" ON "item_os_servico" ("servico_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_item_os_servico_servico_id"`);
    await queryRunner.query(`DROP INDEX "IDX_item_os_servico_os_id"`);
    await queryRunner.query(`DROP TABLE "item_os_servico"`);
  }
}
