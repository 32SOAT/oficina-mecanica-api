import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { ReposicaoEstoqueInput } from '../dto/reposicao-estoque.input';
import { Estoque } from '../../domain/estoque';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';
import {
  ORDEM_SERVICO_REPOSICAO_PORT,
  OrdemServicoReposicaoPort,
} from '../ports/ordem-servico-reposicao.port';

@Injectable()
export class RegistrarReposicaoEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
    @Inject(ORDEM_SERVICO_REPOSICAO_PORT)
    private readonly ordemServicoReposicaoPort: OrdemServicoReposicaoPort,
  ) {}

  async execute(id: number, input: ReposicaoEstoqueInput): Promise<Estoque> {
    const existing = await this.estoqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Item de estoque não encontrado.');
    }

    const estoque = existing.adicionarReposicao(input.quantidade);
    const saved = await this.estoqueRepository.save(estoque);
    await this.ordemServicoReposicaoPort.tentarLiberarOsAposReposicao(
      [saved.id!],
      input.usuarioId ?? null,
    );
    return saved;
  }
}
