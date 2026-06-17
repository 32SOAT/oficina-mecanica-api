import { Inject } from '@nestjs/common';
import {
  calculateOffset,
  createPaginationMeta,
} from '../../../common/pagination/pagination.util';
import { PaginationMeta } from '../../../common/pagination/pagination';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { FindAllServicosInput } from '../dto/find-all-servicos.input';
import { ServicoOutput } from '../dto/servico.output';
import {
  SERVICO_REPOSITORY,
  ServicoRepository,
} from '../ports/servico.repository';

export class FindAllServicosUseCase {
  constructor(
    @Inject(SERVICO_REPOSITORY)
    private readonly servicoRepository: ServicoRepository,
  ) {}

  async execute(input: FindAllServicosInput) {
    const page = Number(input.page ?? 1);
    const take = Number(input.take ?? DEFAULT_PAGE_SIZE);
    const offset = calculateOffset(take, page);
    const [data, count] = await this.servicoRepository.findAll(offset, take);
    const meta = createPaginationMeta(take, page, count);
    return { data, meta };
  }
}

export type FindAllServicosResult = {
  data: ServicoOutput[];
  meta: PaginationMeta | undefined;
};
