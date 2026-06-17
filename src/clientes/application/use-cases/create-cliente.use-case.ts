import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateClienteInput } from '../dto/create-cliente.input';
import { ClienteOutput, ClienteOutputMapper } from '../dto/cliente.output';
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

  async execute(input: CreateClienteInput): Promise<ClienteOutput> {
    const documento = this.buildDocumento(input.documento);

    const exists = await this.clienteRepository.existsByDocumento(
      documento.toString(),
    );

    if (exists) {
      throw new ConflictException('CPF/CNPJ vinculado a outro cliente.');
    }

    const cliente = Cliente.create({
      documento,
      nome: input.nome,
      email: input.email,
      celularNumero: input.celularNumero,
    });

    const saved = await this.clienteRepository.save(cliente);
    return ClienteOutputMapper.fromDomain(saved);
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
