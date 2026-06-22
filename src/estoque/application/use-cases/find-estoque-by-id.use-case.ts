import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { Estoque } from '../../domain/estoque';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';

@Injectable()
export class FindEstoqueByIdUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
  ) {}

  async execute(id: number): Promise<Estoque> {
    const estoque = await this.estoqueRepository.findById(id);
    if (!estoque) {
      throw new NotFoundError('Item de estoque não encontrado.');
    }
    return estoque;
  }
}
