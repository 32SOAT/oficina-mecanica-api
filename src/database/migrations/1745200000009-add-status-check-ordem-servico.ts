import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusCheckOrdemServico1745200000009 implements MigrationInterface {
  name = 'AddStatusCheckOrdemServico1745200000009';

  private readonly STATUS_VALIDOS = [
    'RECEBIDA',
    'EM_DIAGNOSTICO',
    'AGUARDANDO_APROVACAO',
    'APROVADA',
    'AGUARDANDO_SERVICO',
    'AGUARDANDO_PECAS_INSUMOS',
    'EM_EXECUCAO',
    'FINALIZADA',
    'ENTREGUE',
    'REPROVADA',
    'CANCELADA',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const lista = this.STATUS_VALIDOS.map((s) => `'${s}'`).join(', ');
    await queryRunner.query(
      `ALTER TABLE "ordem_servico" ADD CONSTRAINT "CHK_ordem_servico_status" CHECK (status_atual IN (${lista}))`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_status_os" ADD CONSTRAINT "CHK_historico_status_anterior" CHECK (status_anterior IS NULL OR status_anterior IN (${lista}))`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_status_os" ADD CONSTRAINT "CHK_historico_status_novo" CHECK (status_novo IN (${lista}))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "historico_status_os" DROP CONSTRAINT "CHK_historico_status_novo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_status_os" DROP CONSTRAINT "CHK_historico_status_anterior"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordem_servico" DROP CONSTRAINT "CHK_ordem_servico_status"`,
    );
  }
}
