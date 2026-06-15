import { BadRequestException, HttpException, Inject } from '@nestjs/common';
import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from '../../domain/cliente-documento';
import { Cliente } from '../../domain/cliente';
import { CLIENTE_REPOSITORY } from '../cliente-repository.interface';
import type { ClienteRepository } from '../cliente-repository.interface';

export class FindClienteByDocumentoUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(documentoRaw: string): Promise<Cliente> {
    const documento = this.buildDocumento(documentoRaw);
    const cliente = await this.clienteRepository.findByDocumento(
      documento.toString(),
    );
    if (!cliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    return cliente;
  }

  private buildDocumento(documento: string): ClienteDocumento {
    try {
      return ClienteDocumento.create(documento);
    } catch (error) {
      if (error instanceof InvalidClienteDocumentoError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
