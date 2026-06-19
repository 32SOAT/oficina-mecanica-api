import { Inject, Injectable } from '@nestjs/common';
import { Cpf } from '../../../clientes/domain/value-objects/cpf';
import { Placa } from '../../../veiculos/domain/value-objects/placa';
import { mergeObservacaoAvisoCompra } from '../../domain/observacao-compra';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import {
  CriarOrdemServicoInput,
  OrdemServicoOutput,
} from '../dto/ordem-servico.dto';
import { OrdemServicoEventsPort, ORDEM_SERVICO_EVENTS_PORT } from '../ports/ordem-servico-events.port';
import {
  ORDEM_SERVICO_TRANSACTION_PORT,
  OrdemServicoTransactionPort,
} from '../ports/ordem-servico-transaction.port';
import {
  assertDocumentoClienteValido,
  assertOrdemServicoPossuiItens,
  assertPlacaValida,
} from '../validators/ordem-servico.validators';

@Injectable()
export class CreateOrdemServicoUseCase {
  constructor(
    @Inject(ORDEM_SERVICO_TRANSACTION_PORT)
    private readonly transaction: OrdemServicoTransactionPort,
    @Inject(ORDEM_SERVICO_EVENTS_PORT)
    private readonly events: OrdemServicoEventsPort,
  ) {}

  execute(
    input: CriarOrdemServicoInput,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput> {
    assertOrdemServicoPossuiItens(input.itensServico, input.itensPeca);
    assertDocumentoClienteValido(input.documentoCliente);
    assertPlacaValida(input.placa);

    const documento = Cpf.normalize(input.documentoCliente);
    const placa = Placa.normalize(input.placa);

    return this.transaction.runInTransaction(async (tx) => {
      const clienteId = await tx.findClienteIdByDocumento(documento);
      const veiculoId = await tx.findVeiculoIdForCliente(placa, clienteId);
      const itensServico = await tx.buildItensServico(input.itensServico ?? []);
      const { itens: itensPeca, pecaPrecisaObservacaoCompra } =
        await tx.buildItensPecaWithReserva(input.itensPeca ?? []);
      const os = await tx.insertNewOs({
        clienteId,
        veiculoId,
        observacao: mergeObservacaoAvisoCompra(
          input.observacao,
          pecaPrecisaObservacaoCompra,
        ),
        itensServico,
        itensPeca,
      });
      this.events.emitStatusAlterado(
        os.id,
        null,
        StatusOrdemServico.Recebida,
        usuarioId ?? null,
      );
      this.events.emitOsCriada(os.id);
      return os;
    });
  }
}
