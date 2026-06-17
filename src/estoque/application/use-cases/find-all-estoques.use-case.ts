import { Inject, Injectable } from '@nestjs/common';
import {
  calculateOffset,
  createPaginationMeta,
} from '../../../common/pagination/pagination.util';
import { PaginationMeta } from '../../../common/pagination/pagination';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { FindAllEstoquesInput } from '../dto/find-all-estoques.input';
import { EstoqueOutput } from '../dto/estoque.output';
import {
  ESTOQUE_REPOSITORY,
  EstoqueRepository,
} from '../ports/estoque.repository';

@Injectable()
export class FindAllEstoquesUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: EstoqueRepository,
  ) {}

  async execute(input: FindAllEstoquesInput) {
    const page = Number(input.page ?? 1);
    const take = Number(input.take ?? DEFAULT_PAGE_SIZE);
    const offset = calculateOffset(take, page);
    const [data, count] = await this.estoqueRepository.findAll(
      offset,
      take,
      input.estoqueBaixo,
    );
    const meta = createPaginationMeta(take, page, count);
    return { data, meta };
  }
}

export type FindAllEstoquesResult = {
  data: EstoqueOutput[];
  meta: PaginationMeta | undefined;
};
