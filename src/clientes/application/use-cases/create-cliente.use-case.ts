import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { CreateClienteDto } from '../../presentation/dtos/create-cliente.dto';
import { Cliente } from '../../domain/cliente';
import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from '../../domain/cliente-documento';
import { CLIENTE_REPOSITORY } from '../cliente-repository.interface';
import type { ClienteRepository } from '../cliente-repository.interface';

@Injectable()
export class CreateClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const documento = this.buildDocumento(createClienteDto.documento);

    const exists = await this.clienteRepository.existsByDocumento(
      documento.toString(),
    );

    if (exists) {
      throw new ConflictException('CPF/CNPJ vinculado a outro cliente.');
    }

    const cliente = Cliente.create({
      documento,
      nome: createClienteDto.nome,
      email: createClienteDto.email,
      celularNumero: createClienteDto.celularNumero,
    });

    return this.clienteRepository.save(cliente);
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
