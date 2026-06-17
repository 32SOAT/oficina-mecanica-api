import {
  ConflictException,
  HttpException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UpdateClienteInput } from '../dto/update-cliente.input';
import { ClienteOutput, ClienteOutputMapper } from '../dto/cliente.output';
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
  ): Promise<ClienteOutput> {
    const existingCliente = await this.clienteRepository.findById(id);
    if (!existingCliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }

    let documento = existingCliente.documento;
    if (input.documento) {
      documento = this.buildDocumento(input.documento);
      const duplicate = await this.clienteRepository.existsByDocumento(
        documento.toString(),
        id,
      );
      if (duplicate) {
        throw new ConflictException('CPF/CNPJ vinculado a outro cliente.');
      }
    }

    const updatedCliente = existingCliente.update({
      nome: input.nome,
      email: input.email,
      celularNumero: input.celularNumero,
      documento: documento.toString(),
    });

    const saved = await this.clienteRepository.save(updatedCliente);
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
