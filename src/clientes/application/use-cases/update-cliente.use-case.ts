import { Inject, Injectable } from '@nestjs/common';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { UpdateClienteInput } from '../dto/update-cliente.input';
import { Cliente } from '../../domain/cliente';
import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from '../../domain/cliente-documento';
import {
  CLIENTE_REPOSITORY,
  ClienteRepository,
} from '../ports/cliente.repository';

@Injectable()
export class UpdateClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateClienteInput,
  ): Promise<Cliente> {
    const existingCliente = await this.clienteRepository.findById(id);
    if (!existingCliente) {
      throw new NotFoundError('Cliente não encontrado.');
    }

    let documento = existingCliente.documento;
    if (input.documento) {
      documento = this.buildDocumento(input.documento);
      const duplicate = await this.clienteRepository.existsByDocumento(
        documento.toString(),
        id,
      );
      if (duplicate) {
        throw new ConflictError('CPF/CNPJ vinculado a outro cliente.');
      }
    }

    const updatedCliente = existingCliente.update({
      nome: input.nome,
      email: input.email,
      celularNumero: input.celularNumero,
      documento: documento.toString(),
    });

    return this.clienteRepository.save(updatedCliente);
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
