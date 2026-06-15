import {
  ConflictException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { Cliente } from '../../domain/cliente';
import { UpdateClienteDto } from '../../presentation/dtos/update-cliente.dto';
import { UpdateClienteUseCase } from './update-cliente.use-case';
import type { ClienteRepository } from '../cliente-repository.interface';

type ClienteRepositoryMock = jest.Mocked<
  Pick<ClienteRepository, 'findById' | 'existsByDocumento' | 'save'>
>;

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

  it('updates a client when id exists and new documento is unique', async () => {
    const existingCliente = Cliente.create({
      id: 'cliente-id',
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    });
    const newDocumento = '39053344706';
    const updateDto: UpdateClienteDto = {
      documento: newDocumento,
    };
    const updatedCliente = existingCliente.update({ documento: newDocumento });

    clienteRepository.findById.mockResolvedValue(existingCliente);
    clienteRepository.existsByDocumento.mockResolvedValue(false);
    clienteRepository.save.mockResolvedValue(updatedCliente);

    await expect(useCase.execute(existingCliente.id!, updateDto)).resolves.toBe(
      updatedCliente,
    );
    expect(clienteRepository.existsByDocumento).toHaveBeenCalledWith(
      newDocumento,
      existingCliente.id!,
    );
  });

  it('throws http exception when client is not found', async () => {
    clienteRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id', {})).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('throws conflict when documento is used by another client', async () => {
    const existingCliente = Cliente.create({
      id: 'cliente-id',
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    });
    const newDocumento = '39053344706';

    clienteRepository.findById.mockResolvedValue(existingCliente);
    clienteRepository.existsByDocumento.mockResolvedValue(true);

    await expect(
      useCase.execute(existingCliente.id!, { documento: newDocumento }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws bad request when new documento is invalid', async () => {
    const existingCliente = Cliente.create({
      id: 'cliente-id',
      documento: '39053344705',
      nome: 'Jane Doe',
      email: 'jane@example.com',
      celularNumero: '11999999999',
    });

    clienteRepository.findById.mockResolvedValue(existingCliente);

    await expect(
      useCase.execute(existingCliente.id!, { documento: '11111111111' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
