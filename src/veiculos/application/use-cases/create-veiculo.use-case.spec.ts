import {
  BadRequestError,
  ConflictError,
} from '../../../common/application/errors/application.errors';
import { CreateVeiculoUseCase } from './create-veiculo.use-case';
import type { VeiculoRepository } from '../ports/veiculo.repository';
import type { ClienteLookupPort } from '../../../clientes/application/ports/cliente-lookup.port';
import { Veiculo } from '../../domain/veiculo';

describe('CreateVeiculoUseCase', () => {
  let useCase: CreateVeiculoUseCase;
  let veiculoRepository: jest.Mocked<
    Pick<VeiculoRepository, 'existsByPlaca' | 'save'>
  >;
  let clienteLookup: jest.Mocked<
    Pick<ClienteLookupPort, 'resolveClienteIdByDocumento'>
  >;

  const savedVeiculo = Veiculo.create({
    id: 'veiculo-id',
    placa: 'ABC1234',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    clienteId: 'cliente-id',
  });

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
    veiculoRepository.save.mockResolvedValue(savedVeiculo);

    await expect(
      useCase.execute({
        placa: 'ABC1234',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        documentoCliente: '39053344705',
      }),
    ).resolves.toBe(savedVeiculo);
    expect(veiculoRepository.save).toHaveBeenCalled();
  });

  it('throws BadRequestError for invalid plate', async () => {
    await expect(
      useCase.execute({
        placa: 'INVALID',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        documentoCliente: '39053344705',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('throws ConflictError for duplicate plate', async () => {
    veiculoRepository.existsByPlaca.mockResolvedValue(true);
    await expect(
      useCase.execute({
        placa: 'ABC1234',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        documentoCliente: '39053344705',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
