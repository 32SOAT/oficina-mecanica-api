import { EntityManager } from 'typeorm';

export const ESTOQUE_TRANSACTIONAL_PORT = 'ESTOQUE_TRANSACTIONAL_PORT';

export type EstoqueReservaSnapshot = {
  estoqueId: number;
  precoAplicado: number;
  disponivelNoDiagnostico: boolean;
  precisaObservacaoCompra: boolean;
};

export abstract class EstoqueTransactionalPort {
  abstract reservarParaOrdemServico(
    em: EntityManager,
    estoqueId: number,
    quantidade: number,
  ): Promise<EstoqueReservaSnapshot>;

  abstract estornarReservas(
    em: EntityManager,
    itens: Array<{ estoqueId: number; quantidade: number }>,
  ): Promise<void>;

  abstract estoqueCobreReservaAtual(
    em: EntityManager,
    estoqueId: number,
  ): Promise<boolean>;

  abstract darBaixaEmExecucao(
    em: EntityManager,
    estoqueId: number,
    quantidade: number,
  ): Promise<void>;
}
