import { Injectable, Inject } from '@nestjs/common';
import {
  calculateOffset,
  createPaginationMeta,
} from '../../../common/pagination/pagination.util';
import { PaginationMeta } from '../../../common/pagination/pagination';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { FindAllVeiculosInput } from '../dto/find-all-veiculos.input';
import { Veiculo } from '../../domain/veiculo';
import {
  VEICULO_REPOSITORY,
  VeiculoRepository,
} from '../ports/veiculo.repository';

@Injectable()
export class FindAllVeiculosUseCase {
  constructor(
    @Inject(VEICULO_REPOSITORY)
    private readonly veiculoRepository: VeiculoRepository,
  ) {}

  async execute(input: FindAllVeiculosInput) {
    const page = Number(input.page ?? 1);
    const take = Number(input.take ?? DEFAULT_PAGE_SIZE);
    const offset = calculateOffset(take, page);
    const [data, count] = await this.veiculoRepository.findAll(offset, take);
    const meta = createPaginationMeta(take, page, count);
    return { data, meta };
  }
}

export type FindAllVeiculosResult = {
  data: Veiculo[];
  meta: PaginationMeta | undefined;
};
