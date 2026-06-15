import { HttpException, Injectable, Inject } from '@nestjs/common';
import { Cliente } from '../../domain/cliente';
import { CLIENTE_REPOSITORY } from '../cliente-repository.interface';
import type { ClienteRepository } from '../cliente-repository.interface';

@Injectable()
export class RemoveClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(id: string): Promise<Cliente> {
    const existingCliente = await this.clienteRepository.findById(id);
    if (!existingCliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    return this.clienteRepository.softRemove(existingCliente);
  }
}
