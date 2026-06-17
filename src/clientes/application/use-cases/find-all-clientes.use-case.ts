import { Inject, Injectable } from '@nestjs/common';
import {
  calculateOffset,
  createPaginationMeta,
} from '../../../common/pagination/pagination.util';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { FindAllClientesInput } from '../dto/find-all-clientes.input';
import {
  ClienteOutputMapper,
  FindAllClientesOutput,
} from '../dto/cliente.output';
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

  async execute(input: FindAllClientesInput): Promise<FindAllClientesOutput> {
    const page = Number(input.page ?? 1);
    const take = Number(input.take ?? DEFAULT_PAGE_SIZE);
    const skip = calculateOffset(take, page);
    const [data, count] = await this.clienteRepository.findAll(skip, take);
    return {
      data: data.map(ClienteOutputMapper.fromDomain),
      meta: createPaginationMeta(take, page, count),
    };
  }
}
