import { Inject, Injectable } from '@nestjs/common';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoOutput } from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_EVENTS_PORT,
  OrdemServicoEventsPort,
} from '../ports/ordem-servico-events.port';
import {
  ORDEM_SERVICO_TRANSACTION_PORT,
  OrdemServicoTransactionPort,
} from '../ports/ordem-servico-transaction.port';

@Injectable()
export class TransicionarOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_TRANSACTION_PORT)
    private readonly transaction: OrdemServicoTransactionPort,
    @Inject(ORDEM_SERVICO_EVENTS_PORT)
    private readonly events: OrdemServicoEventsPort,
  ) {}

  execute(
    id: string,
    status: StatusOrdemServico,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    return this.transaction.runInTransaction(async (tx) => {
      const os = await tx.loadOs(id, {
        itensServico: true,
        itensPeca: true,
      });
      const { anterior, novo } = os.avancarStatus(status);
      const saved = await tx.saveOs(os);
      this.events.emitStatusAlterado(
        saved.id,
        anterior,
        novo,
        usuarioId ?? null,
      );
      return saved;
    });
  }
}
