import { Inject, Injectable } from '@nestjs/common';
import {
  BadRequestError,
  ConflictError,
} from '../../../common/application/errors/application.errors';
import { CreateClienteInput } from '../dto/create-cliente.input';
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
export class CreateClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: CreateClienteInput): Promise<Cliente> {
    const documento = this.buildDocumento(input.documento);

    const exists = await this.clienteRepository.existsByDocumento(
      documento.toString(),
    );

    if (exists) {
      throw new ConflictError('CPF/CNPJ vinculado a outro cliente.');
    }

    const cliente = Cliente.create({
      documento,
      nome: input.nome,
      email: input.email,
      celularNumero: input.celularNumero,
    });

    return this.clienteRepository.save(cliente);
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
