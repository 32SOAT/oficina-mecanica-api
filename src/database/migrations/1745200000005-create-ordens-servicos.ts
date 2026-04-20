import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdensServicos1745200000005 implements MigrationInterface {
  name = 'CreateOrdensServicos1745200000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ordens_servicos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "veiculo_id" uuid NOT NULL,
        "valor_total" numeric(10, 2) NOT NULL,
        "observacao" text,
        "status_atual" character varying NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_ordens_servicos" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ordens_servicos_veiculo" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ordens_servicos_veiculo_id" ON "ordens_servicos" ("veiculo_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ordens_servicos_veiculo_id"`);
    await queryRunner.query(`DROP TABLE "ordens_servicos"`);
  }
}
