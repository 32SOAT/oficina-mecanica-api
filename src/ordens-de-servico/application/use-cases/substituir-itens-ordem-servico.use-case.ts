import { Inject, Injectable } from '@nestjs/common';
import {
  EditarItensOsInput,
  OrdemServicoOutput,
} from '../dto/ordem-servico.dto';
import {
  ORDEM_SERVICO_QUERY_PORT,
  OrdemServicoQueryPort,
} from '../ports/ordem-servico-query.port';
import {
  ORDEM_SERVICO_TRANSACTION_PORT,
  OrdemServicoTransactionPort,
} from '../ports/ordem-servico-transaction.port';
import {
  assertOsEmDiagnostico,
  assertOrdemServicoPossuiItens,
} from '../validators/ordem-servico.validators';

@Injectable()
export class SubstituirItensOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_QUERY_PORT)
    private readonly query: OrdemServicoQueryPort,
    @Inject(ORDEM_SERVICO_TRANSACTION_PORT)
    private readonly transaction: OrdemServicoTransactionPort,
  ) {}

  async execute(
    id: string,
    input: EditarItensOsInput,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    void usuarioId;
    assertOrdemServicoPossuiItens(input.itensServico, input.itensPeca);
    const os = await this.query.findById(id);
    assertOsEmDiagnostico(os.status);

    await this.transaction.runInTransaction(async (tx) => {
      await tx.replaceItensInDiagnostico(id, input);
    });

    return this.query.findById(id);
  }
}
