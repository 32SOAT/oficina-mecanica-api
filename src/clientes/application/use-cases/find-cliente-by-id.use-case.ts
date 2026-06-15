import { HttpException, Inject } from '@nestjs/common';
import { Cliente } from '../../domain/cliente';
import { CLIENTE_REPOSITORY } from '../cliente-repository.interface';
import type { ClienteRepository } from '../cliente-repository.interface';

export class FindClienteByIdUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findById(id);
    if (!cliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    return cliente;
  }
}
