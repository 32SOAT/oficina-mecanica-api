import {
  CriarOrdemServicoInput,
  EditarItensOsInput,
  OrdemServicoReadModel,
} from '../dto/ordem-servico.dto';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export const ORDEM_SERVICO_TRANSACTION_PORT = 'ORDEM_SERVICO_TRANSACTION_PORT';

export type OsServicoItemDraft = {
  servicoId: number;
  precoAplicado: number;
};

export type OsPecaItemDraft = {
  estoqueId: number;
  quantidade: number;
  precoAplicado: number;
  disponivelNoDiagnostico: boolean;
};

export type OsPecaItemState = {
  id: string;
  estoqueId: number;
  quantidade: number;
  disponivelNoDiagnostico: boolean;
};

export interface OsWorkflowHandle {
  readonly id: string;
  readonly status: StatusOrdemServico;
  observacao: string | null;
  valorTotal: number;
  readonly itensPeca: OsPecaItemState[];
  avancarStatus(
    para: StatusOrdemServico,
  ): { anterior: StatusOrdemServico; novo: StatusOrdemServico };
  calcularValorTotal(): number;
  todasPecasDisponiveis(): boolean;
}

export interface OrdemServicoTransactionalOperations {
  findClienteIdByDocumento(documento: string): Promise<string>;
  findVeiculoIdForCliente(placa: string, clienteId: string): Promise<string>;
  buildItensServico(
    itens: Array<{ servicoId: number }>,
  ): Promise<OsServicoItemDraft[]>;
  buildItensPecaWithReserva(
    itens: Array<{ estoqueId: number; quantidade: number }>,
  ): Promise<{
    itens: OsPecaItemDraft[];
    pecaPrecisaObservacaoCompra: boolean;
  }>;
  insertNewOs(params: {
    clienteId: string;
    veiculoId: string;
    observacao: string | null;
    itensServico: OsServicoItemDraft[];
    itensPeca: OsPecaItemDraft[];
  }): Promise<OrdemServicoReadModel>;
  loadOs(
    osId: string,
    relations: { itensServico?: boolean; itensPeca?: boolean },
  ): Promise<OsWorkflowHandle>;
  saveOs(handle: OsWorkflowHandle): Promise<OrdemServicoReadModel>;
  estornarReservasPecas(
    itens: Array<{ estoqueId: number; quantidade: number }>,
  ): Promise<void>;
  softRemoveOsItens(osId: string): Promise<void>;
  replaceItensInDiagnostico(
    osId: string,
    input: EditarItensOsInput,
  ): Promise<void>;
  refreshValorTotal(handle: OsWorkflowHandle): void;
  syncPecaDisponibilidadeAposAprovacao(handle: OsWorkflowHandle): Promise<void>;
  darBaixaPecasEmExecucao(handle: OsWorkflowHandle): Promise<void>;
  estornarReservasAoReprovar(handle: OsWorkflowHandle): Promise<void>;
  loadOsAguardandoPecasForUpdate(osId: string): Promise<OsWorkflowHandle | null>;
  syncPecasPendentesAposReposicao(handle: OsWorkflowHandle): Promise<void>;
}

export abstract class OrdemServicoTransactionPort {
  abstract runInTransaction<T>(
    work: (operations: OrdemServicoTransactionalOperations) => Promise<T>,
  ): Promise<T>;
}
