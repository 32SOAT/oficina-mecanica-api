import {
  ConflictException,
  HttpException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { UpdateClienteDto } from '../../presentation/dtos/update-cliente.dto';
import { Cliente } from '../../domain/cliente';
import {
  ClienteDocumento,
  InvalidClienteDocumentoError,
} from '../../domain/cliente-documento';
import { CLIENTE_REPOSITORY } from '../cliente-repository.interface';
import type { ClienteRepository } from '../cliente-repository.interface';

export class UpdateClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(
    id: string,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    const existingCliente = await this.clienteRepository.findById(id);
    if (!existingCliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }

    let documento = existingCliente.documento;
    if (updateClienteDto.documento) {
      documento = this.buildDocumento(updateClienteDto.documento);
      const duplicate = await this.clienteRepository.existsByDocumento(
        documento.toString(),
        id,
      );
      if (duplicate) {
        throw new ConflictException('CPF/CNPJ vinculado a outro cliente.');
      }
    }

    const updatedCliente = existingCliente.update({
      nome: updateClienteDto.nome,
      email: updateClienteDto.email,
      celularNumero: updateClienteDto.celular,
      documento: documento.toString(),
    });

    return this.clienteRepository.save(updatedCliente);
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
