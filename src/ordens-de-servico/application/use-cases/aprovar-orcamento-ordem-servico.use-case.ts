import { Inject, Injectable } from '@nestjs/common';
import { mergeObservacaoAvisoCompra } from '../../domain/observacao-compra';
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
export class AprovarOrcamentoOrdemServicoUseCase {
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
      const t1 = os.avancarStatus(StatusOrdemServico.Aprovada);
      await tx.syncPecaDisponibilidadeAposAprovacao(os);
      const proximo = os.todasPecasDisponiveis()
        ? StatusOrdemServico.AguardandoServico
        : StatusOrdemServico.AguardandoPecasInsumos;
      const t2 = os.avancarStatus(proximo);
      if (proximo === StatusOrdemServico.AguardandoServico) {
        os.observacao = mergeObservacaoAvisoCompra(os.observacao, false);
      }
      const saved = await tx.saveOs(os);
      this.events.emitStatusAlterado(
        saved.id,
        t1.anterior,
        t1.novo,
        usuarioId ?? null,
      );
      this.events.emitStatusAlterado(
        saved.id,
        t2.anterior,
        t2.novo,
        usuarioId ?? null,
      );
      this.events.emitOrcamentoAprovado(saved.id);
      return saved;
    });
  }
}
