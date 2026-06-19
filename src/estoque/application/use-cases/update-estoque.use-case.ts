import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { UpdateEstoqueInput } from '../dto/update-estoque.input';
import { Estoque } from '../../domain/estoque';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';

@Injectable()
export class UpdateEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
  ) {}

  async execute(id: number, input: UpdateEstoqueInput): Promise<Estoque> {
    const existing = await this.estoqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Item de estoque não encontrado.');
    }

    if (input.codigo && input.codigo !== existing.codigo) {
      if (await this.estoqueRepository.existsByCodigo(input.codigo, id)) {
        throw new ConflictError(
          'Código já está em uso por outro item de estoque.',
        );
      }
    }

    const estoque = existing.atualizarCadastro(input);
    return this.estoqueRepository.save(estoque);
  }
}
