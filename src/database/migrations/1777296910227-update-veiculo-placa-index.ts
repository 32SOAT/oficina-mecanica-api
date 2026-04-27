import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVeiculoPlacaIndex1777296910227 implements MigrationInterface {
  name = 'UpdateVeiculoPlacaIndex1777296910227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_veiculo_placa"`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_veiculo_placa" ON "veiculo" ("placa") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_veiculo_placa"`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_veiculo_placa" ON "veiculo" ("placa")`,
    );
  }
}
