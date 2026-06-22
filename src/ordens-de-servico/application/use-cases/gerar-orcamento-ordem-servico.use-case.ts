import { Inject, Injectable } from '@nestjs/common';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoReadModel } from '../read-models/ordem-servico-read-model';
import {
  ORDEM_SERVICO_EVENTS_PORT,
  OrdemServicoEventsPort,
} from '../ports/ordem-servico-events.port';
import {
  ORDEM_SERVICO_TRANSACTION_PORT,
  OrdemServicoTransactionPort,
} from '../ports/ordem-servico-transaction.port';

@Injectable()
export class GerarOrcamentoOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_TRANSACTION_PORT)
    private readonly transaction: OrdemServicoTransactionPort,
    @Inject(ORDEM_SERVICO_EVENTS_PORT)
    private readonly events: OrdemServicoEventsPort,
  ) {}

  execute(
    id: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoReadModel> {
    return this.transaction.runInTransaction(async (tx) => {
      const os = await tx.loadOs(id, {
        itensServico: true,
        itensPeca: true,
      });
      const { anterior, novo } = os.avancarStatus(
        StatusOrdemServico.AguardandoAprovacao,
      );
      tx.refreshValorTotal(os);
      const saved = await tx.saveOs(os);
      this.events.emitStatusAlterado(
        saved.id,
        anterior,
        novo,
        usuarioId ?? null,
      );
      this.events.emitOrcamentoGerado(saved.id);
      return saved;
    });
  }
}
