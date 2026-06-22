import { Injectable, Inject } from '@nestjs/common';
import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from '../../domain/cliente-documento';
import { ClienteLookupPort } from '../../application/ports/cliente-lookup.port';
import {
  CLIENTE_REPOSITORY,
  ClienteRepository,
} from '../../application/ports/cliente.repository';

@Injectable()
export class ClienteLookupAdapter implements ClienteLookupPort {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async resolveClienteIdByDocumento(documentoRaw: string): Promise<string> {
    const documento = this.buildDocumento(documentoRaw);
    const cliente = await this.clienteRepository.findByDocumento(
      documento.toString(),
    );
    if (!cliente) {
      throw new NotFoundError('Cliente não encontrado.');
    }
    return cliente.id!;
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
