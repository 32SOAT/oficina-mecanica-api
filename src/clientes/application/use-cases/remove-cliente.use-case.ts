import { Injectable, Inject } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { Cliente } from '../../domain/cliente';
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

  async execute(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findById(id);
    if (!cliente) {
      throw new NotFoundError('Cliente não encontrado.');
    }
    return this.clienteRepository.softRemove(cliente);
  }
}
