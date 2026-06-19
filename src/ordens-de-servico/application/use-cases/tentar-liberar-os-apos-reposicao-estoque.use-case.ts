import { Inject, Injectable } from '@nestjs/common';
import { mergeObservacaoAvisoCompra } from '../../domain/observacao-compra';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import {
  ORDEM_SERVICO_EVENTS_PORT,
  OrdemServicoEventsPort,
} from '../ports/ordem-servico-events.port';
import {
  ORDEM_SERVICO_QUERY_PORT,
  OrdemServicoQueryPort,
} from '../ports/ordem-servico-query.port';
import {
  ORDEM_SERVICO_TRANSACTION_PORT,
  OrdemServicoTransactionPort,
} from '../ports/ordem-servico-transaction.port';

@Injectable()
export class TentarLiberarOsAposReposicaoEstoqueUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_QUERY_PORT)
    private readonly query: OrdemServicoQueryPort,
    @Inject(ORDEM_SERVICO_TRANSACTION_PORT)
    private readonly transaction: OrdemServicoTransactionPort,
    @Inject(ORDEM_SERVICO_EVENTS_PORT)
    private readonly events: OrdemServicoEventsPort,
  ) {}

  async execute(
    estoqueIds: number[],
    usuarioId?: string | null,
  ): Promise<void> {
    const osIds = await this.query.findIdsAguardandoPecasPorEstoque(estoqueIds);
    for (const osId of osIds) {
      await this.transaction.runInTransaction(async (tx) => {
        const os = await tx.loadOsAguardandoPecasForUpdate(osId);
        if (!os) return;
        await tx.syncPecasPendentesAposReposicao(os);
        if (!os.todasPecasDisponiveis()) {
          await tx.saveOs(os);
          return;
        }
        const { anterior, novo } = os.avancarStatus(
          StatusOrdemServico.AguardandoServico,
        );
        os.observacao = mergeObservacaoAvisoCompra(os.observacao, false);
        await tx.saveOs(os);
        this.events.emitStatusAlterado(
          os.id,
          anterior,
          novo,
          usuarioId ?? null,
        );
      });
    }
  }
}
