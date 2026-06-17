import { BadRequestException, HttpException } from '@nestjs/common';
import { FindAllVeiculosUseCase } from './find-all-veiculos.use-case';
import { FindVeiculoByPlacaUseCase } from './find-veiculo-by-placa.use-case';
import { UpdateVeiculoUseCase } from './update-veiculo.use-case';
import { RemoveVeiculoUseCase } from './remove-veiculo.use-case';
import type { VeiculoRepository } from '../ports/veiculo.repository';
import type { ClienteLookupPort } from '../ports/cliente-lookup.port';
import { DEFAULT_PAGE_SIZE } from '../constants';

const output = {
  id: 'veiculo-id',
  placa: 'ABC1D23',
  marca: 'Toyota',
  modelo: 'Corolla',
  ano: 2020,
  cliente_id: 'cliente-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('Veiculo use cases', () => {
  describe('FindAllVeiculosUseCase', () => {
    const veiculoRepository = { findAll: jest.fn() };
    const useCase = new FindAllVeiculosUseCase(
      veiculoRepository as unknown as VeiculoRepository,
    );

    it('returns paginated veiculos', async () => {
      veiculoRepository.findAll.mockResolvedValue([[output], 1]);
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
      veiculoRepository.findByPlaca.mockResolvedValue(output);
      await expect(useCase.execute('ABC1D23')).resolves.toEqual(output);
    });

    it('throws 404 when not found', async () => {
      veiculoRepository.findByPlaca.mockResolvedValue(null);
      await expect(useCase.execute('ABC1D23')).rejects.toBeInstanceOf(
        HttpException,
      );
    });

    it('throws 400 for invalid placa', async () => {
      await expect(useCase.execute('INVALID')).rejects.toBeInstanceOf(
        BadRequestException,
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
      veiculoRepository.findById.mockResolvedValue(output);
      veiculoRepository.save.mockResolvedValue({ ...output, modelo: 'Yaris' });

      const result = await useCase.execute('veiculo-id', { modelo: 'Yaris' });
      expect(result.modelo).toBe('Yaris');
    });

    it('resolves cliente by documento', async () => {
      veiculoRepository.findById.mockResolvedValue(output);
      clienteLookup.resolveClienteIdByDocumento.mockResolvedValue('new-cliente');
      veiculoRepository.save.mockResolvedValue({
        ...output,
        cliente_id: 'new-cliente',
      });

      await useCase.execute('veiculo-id', {
        documentoCliente: '39053344705',
      });

      expect(clienteLookup.resolveClienteIdByDocumento).toHaveBeenCalled();
    });

    it('throws when not found', async () => {
      veiculoRepository.findById.mockResolvedValue(null);
      await expect(
        useCase.execute('missing', { modelo: 'X' }),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('RemoveVeiculoUseCase', () => {
    const veiculoRepository = { findById: jest.fn(), softRemove: jest.fn() };
    const useCase = new RemoveVeiculoUseCase(
      veiculoRepository as unknown as VeiculoRepository,
    );

    it('removes veiculo', async () => {
      veiculoRepository.findById.mockResolvedValue(output);
      veiculoRepository.softRemove.mockResolvedValue({
        ...output,
        deletedAt: new Date(),
      });

      const result = await useCase.execute('veiculo-id');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('throws when not found', async () => {
      veiculoRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
        HttpException,
      );
    });
  });
});
