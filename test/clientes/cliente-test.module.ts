import { Module } from '@nestjs/common';
import { CLIENTE_REPOSITORY } from '../../src/clientes/application/cliente-repository.interface';
import { CreateClienteUseCase } from '../../src/clientes/application/use-cases/create-cliente.use-case';
import { FindAllClientesUseCase } from '../../src/clientes/application/use-cases/find-all-clientes.use-case';
import { FindClienteByDocumentoUseCase } from '../../src/clientes/application/use-cases/find-cliente-by-documento.use-case';
import { FindClienteByIdUseCase } from '../../src/clientes/application/use-cases/find-cliente-by-id.use-case';
import { UpdateClienteUseCase } from '../../src/clientes/application/use-cases/update-cliente.use-case';
import { RemoveClienteUseCase } from '../../src/clientes/application/use-cases/remove-cliente.use-case';

const clienteRepositoryMock = {
  save: jest.fn(),
  findAll: jest.fn(),
  findByDocumento: jest.fn(),
  findById: jest.fn(),
  existsByDocumento: jest.fn(),
  softRemove: jest.fn(),
};

@Module({
  providers: [
    CreateClienteUseCase,
    FindAllClientesUseCase,
    FindClienteByDocumentoUseCase,
    FindClienteByIdUseCase,
    UpdateClienteUseCase,
    RemoveClienteUseCase,
    {
      provide: CLIENTE_REPOSITORY,
      useValue: clienteRepositoryMock,
    },
  ],
})
export class ClienteTestModule {}
