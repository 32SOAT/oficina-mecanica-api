import { CriarOrdemServicoInput } from '../dto/ordem-servico.dto';
import { EditarItensOsInput } from '../dto/ordem-servico.dto';
import { FiltrosOrdemServicoInput } from '../dto/ordem-servico.dto';
import { HistoricoStatusOutput } from '../dto/ordem-servico.dto';
import { OrdemServicoOutput } from '../dto/ordem-servico.dto';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export const ORDEM_SERVICO_REPOSITORY = 'ORDEM_SERVICO_REPOSITORY';

export abstract class OrdemServicoRepository {
  abstract criar(
    input: CriarOrdemServicoInput,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput>;
  abstract substituirItensEmDiagnostico(
    osId: string,
    input: EditarItensOsInput,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput>;
  abstract gerarOrcamento(
    osId: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput>;
  abstract aprovarOrcamento(
    osId: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput>;
  abstract reprovarOrcamento(
    osId: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput>;
  abstract iniciarExecucao(
    osId: string,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput>;
  abstract transicionar(
    osId: string,
    para: StatusOrdemServico,
    usuarioId?: string | null,
  ): Promise<OrdemServicoOutput>;
  abstract findAll(input: FiltrosOrdemServicoInput): Promise<{
    data: OrdemServicoOutput[];
    meta: {
      itemsPerPage: number;
      totalItems: number;
      currentPage: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>;
  abstract findById(id: string): Promise<OrdemServicoOutput>;
  abstract findHistorico(id: string): Promise<HistoricoStatusOutput[]>;
  abstract tentarLiberarOsAposReposicaoEstoque(
    estoqueIdsAfetados: number[],
    usuarioId?: string | null,
  ): Promise<void>;
}
