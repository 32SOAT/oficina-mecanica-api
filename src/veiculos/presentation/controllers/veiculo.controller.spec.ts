import { HttpException } from '@nestjs/common';
import { VeiculoController } from './veiculo.controller';
import { CreateVeiculoUseCase } from '../../application/use-cases/create-veiculo.use-case';
import { FindAllVeiculosUseCase } from '../../application/use-cases/find-all-veiculos.use-case';
import { FindVeiculoByPlacaUseCase } from '../../application/use-cases/find-veiculo-by-placa.use-case';
import { UpdateVeiculoUseCase } from '../../application/use-cases/update-veiculo.use-case';
import { RemoveVeiculoUseCase } from '../../application/use-cases/remove-veiculo.use-case';
import { VeiculoPresentationMapper } from '../mappers/veiculo-presentation.mapper';

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

describe('VeiculoController', () => {
  let controller: VeiculoController;
  const createVeiculoUseCase = { execute: jest.fn() };
  const findAllVeiculosUseCase = { execute: jest.fn() };
  const findVeiculoByPlacaUseCase = { execute: jest.fn() };
  const updateVeiculoUseCase = { execute: jest.fn() };
  const removeVeiculoUseCase = { execute: jest.fn() };

  beforeEach(() => {
    controller = new VeiculoController(
      createVeiculoUseCase as unknown as CreateVeiculoUseCase,
      findAllVeiculosUseCase as unknown as FindAllVeiculosUseCase,
      findVeiculoByPlacaUseCase as unknown as FindVeiculoByPlacaUseCase,
      updateVeiculoUseCase as unknown as UpdateVeiculoUseCase,
      removeVeiculoUseCase as unknown as RemoveVeiculoUseCase,
    );
  });

  it('creates a vehicle', async () => {
    createVeiculoUseCase.execute.mockResolvedValue(output);
    const dto = {
      placa: 'ABC1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      documentoCliente: '39053344705',
    };
    const result = await controller.create(dto);
    expect(result.id).toBe(output.id);
    expect(createVeiculoUseCase.execute).toHaveBeenCalledWith(
      VeiculoPresentationMapper.toCreateInput(dto),
    );
  });

  it('propagates create errors', async () => {
    const error = new HttpException('Invalid', 400);
    createVeiculoUseCase.execute.mockRejectedValue(error);
    await expect(
      controller.create({
        placa: 'x',
        marca: 'T',
        modelo: 'C',
        ano: 2020,
        documentoCliente: 'x',
      }),
    ).rejects.toBe(error);
  });

  it('lists vehicles', async () => {
    const paginationDto = { page: 1, take: 10 };
    findAllVeiculosUseCase.execute.mockResolvedValue({
      data: [output],
      meta: { currentPage: 1 },
    });
    const result = await controller.findAll(paginationDto);
    expect(result.data).toHaveLength(1);
    expect(findAllVeiculosUseCase.execute).toHaveBeenCalledWith(
      VeiculoPresentationMapper.toFindAllInput(paginationDto),
    );
  });

  it('finds by placa', async () => {
    findVeiculoByPlacaUseCase.execute.mockResolvedValue(output);
    const result = await controller.findByPlaca('ABC1234');
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(output.id);
  });

  it('updates a vehicle', async () => {
    const updateDto = { marca: 'Honda' };
    updateVeiculoUseCase.execute.mockResolvedValue(output);
    await expect(
      controller.update(output.id, updateDto),
    ).resolves.toEqual({
      success: true,
      message: 'Veículo atualizado com sucesso.',
    });
    expect(updateVeiculoUseCase.execute).toHaveBeenCalledWith(
      output.id,
      VeiculoPresentationMapper.toUpdateInput(updateDto),
    );
  });

  it('removes a vehicle', async () => {
    removeVeiculoUseCase.execute.mockResolvedValue(output);
    await expect(controller.remove(output.id)).resolves.toEqual({
      success: true,
      message: 'Veículo removido com sucesso.',
    });
  });
});
