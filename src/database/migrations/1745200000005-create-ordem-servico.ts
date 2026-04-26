import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdemServico1745200000005 implements MigrationInterface {
  name = 'CreateOrdemServico1745200000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ordem_servico" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "veiculo_id" uuid NOT NULL,
        "cliente_id" uuid NOT NULL,
        "valor_total" numeric(10, 2) NOT NULL,
        "observacao" text,
        "status_atual" character varying NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_ordem_servico" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ordem_servico_veiculo" FOREIGN KEY ("veiculo_id") REFERENCES "veiculo" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ordem_servico_cliente" FOREIGN KEY ("cliente_id") REFERENCES "cliente" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ordem_servico_veiculo_id" ON "ordem_servico" ("veiculo_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ordem_servico_cliente_id" ON "ordem_servico" ("cliente_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ordem_servico_cliente_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ordem_servico_veiculo_id"`);
    await queryRunner.query(`DROP TABLE "ordem_servico"`);
  }
}
