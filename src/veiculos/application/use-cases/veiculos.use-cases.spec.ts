import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { FindAllVeiculosUseCase } from './find-all-veiculos.use-case';
import { FindVeiculoByPlacaUseCase } from './find-veiculo-by-placa.use-case';
import { UpdateVeiculoUseCase } from './update-veiculo.use-case';
import { RemoveVeiculoUseCase } from './remove-veiculo.use-case';
import type { VeiculoRepository } from '../ports/veiculo.repository';
import type { ClienteLookupPort } from '../../../clientes/application/ports/cliente-lookup.port';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { Veiculo } from '../../domain/veiculo';

const makeVeiculo = (
  overrides: Partial<ConstructorParameters<typeof Veiculo.create>[0]> = {},
) =>
  Veiculo.create({
    id: 'veiculo-id',
    placa: 'ABC1D23',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    clienteId: 'cliente-id',
    ...overrides,
  });

describe('Veiculo use cases', () => {
  describe('FindAllVeiculosUseCase', () => {
    const veiculoRepository = { findAll: jest.fn() };
    const useCase = new FindAllVeiculosUseCase(
      veiculoRepository as unknown as VeiculoRepository,
    );

    it('returns paginated veiculos', async () => {
      const veiculo = makeVeiculo();
      veiculoRepository.findAll.mockResolvedValue([[veiculo], 1]);
      const result = await useCase.execute({ page: 1, take: 10 });
      expect(veiculoRepository.findAll).toHaveBeenCalledWith(0, 10);
      expect(result.data).toHaveLength(1);
    });

    it('uses defaults', async () => {
      veiculoRepository.findAll.mockResolvedValue([[], 0]);
      await useCase.execute({});
      expect(veiculoRepository.findAll).toHaveBeenCalledWith(
        0,
        DEFAULT_PAGE_SIZE,
      );
    });
  });

  describe('FindVeiculoByPlacaUseCase', () => {
    const veiculoRepository = { findByPlaca: jest.fn() };
    const useCase = new FindVeiculoByPlacaUseCase(
      veiculoRepository as unknown as VeiculoRepository,
    );

    it('finds by placa', async () => {
      const veiculo = makeVeiculo();
      veiculoRepository.findByPlaca.mockResolvedValue(veiculo);
      await expect(useCase.execute('ABC1D23')).resolves.toEqual(veiculo);
    });

    it('throws NotFoundError when not found', async () => {
      veiculoRepository.findByPlaca.mockResolvedValue(null);
      await expect(useCase.execute('ABC1D23')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws BadRequestError for invalid placa', async () => {
      await expect(useCase.execute('INVALID')).rejects.toBeInstanceOf(
        BadRequestError,
      );
    });
  });

  describe('UpdateVeiculoUseCase', () => {
    const veiculoRepository = { findById: jest.fn(), save: jest.fn() };
    const clienteLookup = { resolveClienteIdByDocumento: jest.fn() };
    const useCase = new UpdateVeiculoUseCase(
      veiculoRepository as unknown as VeiculoRepository,
      clienteLookup as unknown as ClienteLookupPort,
    );

    it('updates veiculo', async () => {
      const existing = makeVeiculo();
      const updated = makeVeiculo({ modelo: 'Yaris' });
      veiculoRepository.findById.mockResolvedValue(existing);
      veiculoRepository.save.mockResolvedValue(updated);

      const result = await useCase.execute('veiculo-id', { modelo: 'Yaris' });
      expect(result.modelo).toBe('Yaris');
    });

    it('resolves cliente by documento', async () => {
      const existing = makeVeiculo();
      veiculoRepository.findById.mockResolvedValue(existing);
      clienteLookup.resolveClienteIdByDocumento.mockResolvedValue('new-cliente');
      veiculoRepository.save.mockResolvedValue(
        makeVeiculo({ clienteId: 'new-cliente' }),
      );

      await useCase.execute('veiculo-id', {
        documentoCliente: '39053344705',
      });

      expect(clienteLookup.resolveClienteIdByDocumento).toHaveBeenCalled();
    });

    it('throws NotFoundError when not found', async () => {
      veiculoRepository.findById.mockResolvedValue(null);
      await expect(
        useCase.execute('missing', { modelo: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('RemoveVeiculoUseCase', () => {
    const veiculoRepository = { findById: jest.fn(), softRemove: jest.fn() };
    const useCase = new RemoveVeiculoUseCase(
      veiculoRepository as unknown as VeiculoRepository,
    );

    it('removes veiculo', async () => {
      const existing = makeVeiculo();
      const removed = makeVeiculo({ deletedAt: new Date() });
      veiculoRepository.findById.mockResolvedValue(existing);
      veiculoRepository.softRemove.mockResolvedValue(removed);

      const result = await useCase.execute('veiculo-id');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundError when not found', async () => {
      veiculoRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
