import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ClienteOutput, ClienteOutputMapper } from '../dto/cliente.output';
import {
  CLIENTE_REPOSITORY,
  ClienteRepository,
} from '../ports/cliente.repository';

@Injectable()
export class RemoveClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(id: string): Promise<ClienteOutput> {
    const existingCliente = await this.clienteRepository.findById(id);
    if (!existingCliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    const removed = await this.clienteRepository.softRemove(existingCliente);
    return ClienteOutputMapper.fromDomain(removed);
  }
}
