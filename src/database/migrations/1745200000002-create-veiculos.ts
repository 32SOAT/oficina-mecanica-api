import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVeiculos1745200000002 implements MigrationInterface {
  name = 'CreateVeiculos1745200000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "veiculos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "placa" character varying NOT NULL,
        "marca" character varying NOT NULL,
        "modelo" character varying NOT NULL,
        "ano" integer NOT NULL,
        "cliente_id" uuid NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_veiculos" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_veiculos_placa" UNIQUE ("placa"),
        CONSTRAINT "FK_veiculos_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_veiculos_cliente_id" ON "veiculos" ("cliente_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_veiculos_cliente_id"`);
    await queryRunner.query(`DROP TABLE "veiculos"`);
  }
}
