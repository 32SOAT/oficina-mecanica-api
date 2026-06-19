import { Inject, Injectable } from '@nestjs/common';
import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { OperacaoEstoqueInput } from '../dto/operacao-estoque.input';
import { TipoOperacaoEstoque } from '../dto/tipo-operacao-estoque';
import { Estoque } from '../../domain/estoque';
import { EstoqueOperacaoInvalidaError } from '../../domain/errors/estoque-operacao-invalida.error';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';

@Injectable()
export class ExecutarOperacaoEstoqueUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
  ) {}

  async execute(id: number, input: OperacaoEstoqueInput): Promise<Estoque> {
    if (input.operacao === TipoOperacaoEstoque.REPOSICAO) {
      throw new BadRequestError(
        'Operação "reposicao" é tratada no controller.',
      );
    }

    const existing = await this.estoqueRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Item de estoque não encontrado.');
    }

    let estoque = existing;

    try {
      if (input.operacao === TipoOperacaoEstoque.RESERVAR) {
        estoque = estoque.reservar(input.quantidade);
      } else if (input.operacao === TipoOperacaoEstoque.BAIXA) {
        estoque = estoque.darBaixaSomenteDisponivel(input.quantidade);
      } else {
        throw new BadRequestError('Operação de estoque inválida.');
      }
    } catch (error) {
      if (error instanceof EstoqueOperacaoInvalidaError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    return this.estoqueRepository.save(estoque);
  }
}
