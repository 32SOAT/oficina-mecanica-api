import { Injectable, Inject } from '@nestjs/common';
import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from '../../domain/cliente-documento';
import { Cliente } from '../../domain/cliente';
import {
  CLIENTE_REPOSITORY,
  ClienteRepository,
} from '../ports/cliente.repository';

@Injectable()
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
      throw new NotFoundError('Cliente não encontrado.');
    }
    return cliente;
  }

  private buildDocumento(documento: string): ClienteDocumento {
    try {
      return ClienteDocumento.create(documento);
    } catch (error) {
      if (error instanceof InvalidClienteDocumentoError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }
}
