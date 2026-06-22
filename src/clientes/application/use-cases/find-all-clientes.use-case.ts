import { Inject, Injectable } from '@nestjs/common';
import {
  calculateOffset,
  createPaginationMeta,
} from '../../../common/pagination/pagination.util';
import { PaginationMeta } from '../../../common/pagination/pagination';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { FindAllClientesInput } from '../dto/find-all-clientes.input';
import { Cliente } from '../../domain/cliente';
import {
  CLIENTE_REPOSITORY,
  ClienteRepository,
} from '../ports/cliente.repository';

@Injectable()
export class FindAllClientesUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: FindAllClientesInput): Promise<FindAllClientesResult> {
    const page = Number(input.page ?? 1);
    const take = Number(input.take ?? DEFAULT_PAGE_SIZE);
    const skip = calculateOffset(take, page);
    const [data, count] = await this.clienteRepository.findAll(skip, take);
    return {
      data,
      meta: createPaginationMeta(take, page, count),
    };
  }
}

export type FindAllClientesResult = {
  data: Cliente[];
  meta: PaginationMeta | undefined;
};
