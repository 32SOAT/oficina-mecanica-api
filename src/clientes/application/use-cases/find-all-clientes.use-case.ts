import { Injectable } from '@nestjs/common';
import { DefaultPageSize } from '../../../querying/constants';
import { PaginationDto } from '../../../querying/dtos/pagination.dto';
import type { ClienteRepository } from '../cliente-repository.interface';

@Injectable()
export class FindAllClientesUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page ?? 1);
    const take = Number(paginationDto.take ?? DefaultPageSize.CLIENTE);
    const skip = (page - 1) * take;
    const [data, count] = await this.clienteRepository.findAll(skip, take);
    return {
      data,
      count,
      page,
      take,
    };
  }
}
