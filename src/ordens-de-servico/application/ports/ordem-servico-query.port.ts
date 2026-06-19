import {
  FiltrosOrdemServicoInput,
  HistoricoStatusReadModel,
  OrdemServicoReadModel,
} from '../dto/ordem-servico.dto';

export const ORDEM_SERVICO_QUERY_PORT = 'ORDEM_SERVICO_QUERY_PORT';

export abstract class OrdemServicoQueryPort {
  abstract findAll(input: FiltrosOrdemServicoInput): Promise<{
    data: OrdemServicoReadModel[];
    meta: {
      itemsPerPage: number;
      totalItems: number;
      currentPage: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>;
  abstract findById(id: string): Promise<OrdemServicoReadModel>;
  abstract findHistorico(id: string): Promise<HistoricoStatusReadModel[]>;
  abstract findIdsAguardandoPecasPorEstoque(
    estoqueIds: number[],
  ): Promise<string[]>;
}
