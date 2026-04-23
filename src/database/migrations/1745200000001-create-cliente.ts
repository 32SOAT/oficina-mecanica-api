import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCliente1745200000001 implements MigrationInterface {
  name = 'CreateCliente1745200000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cliente" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "documento" character varying NOT NULL,
        "nome" character varying NOT NULL,
        "email" character varying NOT NULL,
        "celular_numero" character varying NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_cliente" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cliente_documento" ON "cliente" ("documento")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_cliente_documento"`);
    await queryRunner.query(`DROP TABLE "cliente"`);
  }
}
