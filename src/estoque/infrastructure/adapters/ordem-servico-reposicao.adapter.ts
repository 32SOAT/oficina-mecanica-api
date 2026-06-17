import { Injectable } from '@nestjs/common';
import { OrdemServicoReposicaoPort } from '../../application/ports/ordem-servico-reposicao.port';
import { TentarLiberarOsAposReposicaoEstoqueUseCase } from '../../../ordens-de-servico/application/use-cases/tentar-liberar-os-apos-reposicao-estoque.use-case';

@Injectable()
export class OrdemServicoReposicaoAdapter implements OrdemServicoReposicaoPort {
  constructor(
    private readonly tentarLiberarOsAposReposicaoEstoqueUseCase: TentarLiberarOsAposReposicaoEstoqueUseCase,
  ) {}

  async tentarLiberarOsAposReposicao(
    estoqueIds: number[],
    usuarioId: string | null,
  ): Promise<void> {
    await this.tentarLiberarOsAposReposicaoEstoqueUseCase.execute(
      estoqueIds,
      usuarioId,
    );
  }
}
