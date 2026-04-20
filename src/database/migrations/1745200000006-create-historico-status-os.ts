import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHistoricoStatusOs1745200000006 implements MigrationInterface {
  name = 'CreateHistoricoStatusOs1745200000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "historico_status_os" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "os_id" uuid NOT NULL,
        "status_anterior" character varying,
        "status_novo" character varying NOT NULL,
        "usuario_id" uuid,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_historico_status_os" PRIMARY KEY ("id"),
        CONSTRAINT "FK_historico_status_os_ordem_servico" FOREIGN KEY ("os_id") REFERENCES "ordem_servico" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_historico_status_os_os_id" ON "historico_status_os" ("os_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_historico_status_os_os_id"`);
    await queryRunner.query(`DROP TABLE "historico_status_os"`);
  }
}
