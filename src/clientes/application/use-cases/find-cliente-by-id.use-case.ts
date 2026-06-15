import { HttpException, Injectable } from '@nestjs/common';
import { Cliente } from '../../domain/cliente';
import type { ClienteRepository } from '../cliente-repository.interface';

@Injectable()
export class FindClienteByIdUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findById(id);
    if (!cliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    return cliente;
  }
}
