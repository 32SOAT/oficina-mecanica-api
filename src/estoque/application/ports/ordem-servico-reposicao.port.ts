export const ORDEM_SERVICO_REPOSICAO_PORT = 'ORDEM_SERVICO_REPOSICAO_PORT';

export abstract class OrdemServicoReposicaoPort {
  abstract tentarLiberarOsAposReposicao(
    estoqueIds: number[],
    usuarioId: string | null,
  ): Promise<void>;
}
