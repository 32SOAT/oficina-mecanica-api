import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from '../../domain/cliente-documento';
import {
  ClienteLookupPort,
  ClienteSnapshot,
} from '../../application/ports/cliente-lookup.port';
import {
  CLIENTE_REPOSITORY,
  ClienteRepository,
} from '../../application/ports/cliente.repository';
import { ClienteTypeormEntity } from '../typeorm/entity/cliente.typeorm.entity';

@Injectable()
export class ClienteLookupAdapter implements ClienteLookupPort {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
    @InjectRepository(ClienteTypeormEntity)
    private readonly repository: Repository<ClienteTypeormEntity>,
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

  async findSnapshotById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ClienteSnapshot | null> {
    const cliente = await this.repository.findOne({
      where: { id },
      withDeleted: options?.includeDeleted ?? false,
    });
    if (!cliente) {
      return null;
    }
    return {
      id: cliente.id,
      documento: cliente.documento,
      nome: cliente.nome,
      email: cliente.email,
      celularNumero: cliente.celularNumero,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
      deletedAt: cliente.deletedAt,
    };
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
