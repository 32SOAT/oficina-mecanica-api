import {
  ConflictException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';

import { UpdateClienteUseCase } from './update-cliente.use-case';
import type { ClienteRepository } from '../cliente-repository.interface';

import { Cliente } from '../../domain/cliente';
import { ClienteDocumento } from '../../domain/cliente-documento';
import { UpdateClienteDto } from '../../presentation/dtos/update-cliente.dto';

type ClienteRepositoryMock = jest.Mocked<
  Pick<ClienteRepository, 'findById' | 'existsByDocumento' | 'save'>
>;

const makeCliente = () =>
  Cliente.create({
    id: 'cliente-id',
    documento: ClienteDocumento.create('52998224725'),
    nome: 'Jane Doe',
    email: 'jane@example.com',
    celularNumero: '11999999999',
  });

describe('UpdateClienteUseCase', () => {
  let useCase: UpdateClienteUseCase;
  let clienteRepository: ClienteRepositoryMock;

  beforeEach(() => {
    clienteRepository = {
      findById: jest.fn(),
      existsByDocumento: jest.fn(),
      save: jest.fn(),
    };

    useCase = new UpdateClienteUseCase(
      clienteRepository as unknown as ClienteRepository,
    );
  });

  it('updates a client when data is valid and documento is unique', async () => {
    const existingCliente = makeCliente();

    const dto: UpdateClienteDto = {
      documento: '04252011000110',
      nome: 'Serviços Vivo',
      email: 'servico-vivo.updated@example.com',
      celular: '11988888888',
    };

    const updatedCliente = Cliente.create({
      id: existingCliente.id!,
      documento: ClienteDocumento.create(dto.documento!),
      nome: dto.nome!,
      email: dto.email!,
      celularNumero: dto.celular!,
    });

    clienteRepository.findById.mockResolvedValue(existingCliente);
    clienteRepository.existsByDocumento.mockResolvedValue(false);
    clienteRepository.save.mockResolvedValue(updatedCliente);

    const result = await useCase.execute(existingCliente.id!, dto);

    expect(result).toBe(updatedCliente);

    expect(clienteRepository.findById).toHaveBeenCalledWith(
      existingCliente.id!,
    );

    expect(clienteRepository.existsByDocumento).toHaveBeenCalledWith(
      dto.documento,
      existingCliente.id!,
    );

    expect(clienteRepository.save).toHaveBeenCalledWith(updatedCliente);
  });

  it('throws http exception when client is not found', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id', {})).rejects.toBeInstanceOf(
      HttpException,
    );

    expect(clienteRepository.existsByDocumento).not.toHaveBeenCalled();
    expect(clienteRepository.save).not.toHaveBeenCalled();
  });

  it('throws conflict when documento is used by another client', async () => {
    const existingCliente = makeCliente();

    clienteRepository.findById.mockResolvedValue(existingCliente);
    clienteRepository.existsByDocumento.mockResolvedValue(true);

    await expect(
      useCase.execute(existingCliente.id!, {
        documento: '04252011000110', // ✔ válido CNPJ
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(clienteRepository.save).not.toHaveBeenCalled();
  });

  it('throws bad request when documento is invalid', async () => {
    const existingCliente = makeCliente();

    clienteRepository.findById.mockResolvedValue(existingCliente);

    await expect(
      useCase.execute(existingCliente.id!, {
        documento: '11111111111',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(clienteRepository.existsByDocumento).not.toHaveBeenCalled();
    expect(clienteRepository.save).not.toHaveBeenCalled();
  });
});
