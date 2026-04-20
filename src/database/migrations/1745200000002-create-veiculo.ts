import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVeiculo1745200000002 implements MigrationInterface {
  name = 'CreateVeiculo1745200000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "veiculo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "placa" character varying NOT NULL,
        "marca" character varying NOT NULL,
        "modelo" character varying NOT NULL,
        "ano" integer NOT NULL,
        "cliente_id" uuid NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_veiculo" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_veiculo_placa" UNIQUE ("placa"),
        CONSTRAINT "FK_veiculo_cliente" FOREIGN KEY ("cliente_id") REFERENCES "cliente" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_veiculo_cliente_id" ON "veiculo" ("cliente_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_veiculo_cliente_id"`);
    await queryRunner.query(`DROP TABLE "veiculo"`);
  }
}
