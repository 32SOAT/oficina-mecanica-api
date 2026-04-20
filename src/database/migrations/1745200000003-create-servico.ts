import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServico1745200000003 implements MigrationInterface {
  name = 'CreateServico1745200000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "servico" (
        "id" SERIAL NOT NULL,
        "servico" character varying NOT NULL,
        "descricao" text,
        "preco_mao_de_obra" numeric(10, 2) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_servico" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "servico"`);
  }
}
