import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ClienteOutput, ClienteOutputMapper } from '../dto/cliente.output';
import {
  CLIENTE_REPOSITORY,
  ClienteRepository,
} from '../ports/cliente.repository';

@Injectable()
export class FindClienteByIdUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(id: string): Promise<ClienteOutput> {
    const cliente = await this.clienteRepository.findById(id);
    if (!cliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    return ClienteOutputMapper.fromDomain(cliente);
  }
}
