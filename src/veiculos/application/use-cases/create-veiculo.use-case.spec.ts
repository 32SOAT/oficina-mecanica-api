import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateVeiculoUseCase } from './create-veiculo.use-case';
import type { VeiculoRepository } from '../ports/veiculo.repository';
import type { ClienteLookupPort } from '../ports/cliente-lookup.port';

describe('CreateVeiculoUseCase', () => {
  let useCase: CreateVeiculoUseCase;
  let veiculoRepository: jest.Mocked<
    Pick<VeiculoRepository, 'existsByPlaca' | 'save'>
  >;
  let clienteLookup: jest.Mocked<
    Pick<ClienteLookupPort, 'resolveClienteIdByDocumento'>
  >;

  const output = {
    id: 'veiculo-id',
    placa: 'ABC1234',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    cliente_id: 'cliente-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    veiculoRepository = {
      existsByPlaca: jest.fn(),
      save: jest.fn(),
    };
    clienteLookup = { resolveClienteIdByDocumento: jest.fn() };
    useCase = new CreateVeiculoUseCase(
      veiculoRepository as unknown as VeiculoRepository,
      clienteLookup as unknown as ClienteLookupPort,
    );
  });

  it('creates vehicle when valid', async () => {
    clienteLookup.resolveClienteIdByDocumento.mockResolvedValue('cliente-id');
    veiculoRepository.existsByPlaca.mockResolvedValue(false);
    veiculoRepository.save.mockResolvedValue(output);

    await expect(
      useCase.execute({
        placa: 'ABC1234',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        documentoCliente: '39053344705',
      }),
    ).resolves.toBe(output);
    expect(veiculoRepository.save).toHaveBeenCalled();
  });

  it('throws for invalid plate', async () => {
    await expect(
      useCase.execute({
        placa: 'INVALID',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        documentoCliente: '39053344705',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws for duplicate plate', async () => {
    veiculoRepository.existsByPlaca.mockResolvedValue(true);
    await expect(
      useCase.execute({
        placa: 'ABC1234',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        documentoCliente: '39053344705',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
