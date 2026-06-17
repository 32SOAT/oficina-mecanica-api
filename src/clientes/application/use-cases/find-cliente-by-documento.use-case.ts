import { Injectable, BadRequestException, HttpException, Inject } from '@nestjs/common';
import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from '../../domain/cliente-documento';
import { ClienteOutput, ClienteOutputMapper } from '../dto/cliente.output';
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

  async execute(documentoRaw: string): Promise<ClienteOutput> {
    const documento = this.buildDocumento(documentoRaw);
    const cliente = await this.clienteRepository.findByDocumento(
      documento.toString(),
    );
    if (!cliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    return ClienteOutputMapper.fromDomain(cliente);
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
