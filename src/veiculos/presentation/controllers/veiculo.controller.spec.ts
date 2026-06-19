import { BadRequestError } from '../../../common/application/errors/application.errors';
import { VeiculoController } from './veiculo.controller';
import { CreateVeiculoUseCase } from '../../application/use-cases/create-veiculo.use-case';
import { FindAllVeiculosUseCase } from '../../application/use-cases/find-all-veiculos.use-case';
import { FindVeiculoByPlacaUseCase } from '../../application/use-cases/find-veiculo-by-placa.use-case';
import { UpdateVeiculoUseCase } from '../../application/use-cases/update-veiculo.use-case';
import { RemoveVeiculoUseCase } from '../../application/use-cases/remove-veiculo.use-case';
import { VeiculoPresentationMapper } from '../mappers/veiculo-presentation.mapper';
import { Veiculo } from '../../domain/veiculo';

const makeVeiculo = () =>
  Veiculo.create({
    id: 'veiculo-id',
    placa: 'ABC1234',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    clienteId: 'cliente-id',
  });

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
    const veiculo = makeVeiculo();
    createVeiculoUseCase.execute.mockResolvedValue(veiculo);
    const dto = {
      placa: 'ABC1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      documentoCliente: '39053344705',
    };
    const result = await controller.create(dto);
    expect(result.id).toBe(veiculo.id);
    expect(createVeiculoUseCase.execute).toHaveBeenCalledWith(
      VeiculoPresentationMapper.toCreateInput(dto),
    );
  });

  it('propagates create BadRequestError from use case', async () => {
    const error = new BadRequestError('Invalid');
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
    const veiculo = makeVeiculo();
    const paginationDto = { page: 1, take: 10 };
    findAllVeiculosUseCase.execute.mockResolvedValue({
      data: [veiculo],
      meta: { currentPage: 1 },
    });
    const result = await controller.findAll(paginationDto);
    expect(result.data).toHaveLength(1);
    expect(findAllVeiculosUseCase.execute).toHaveBeenCalledWith(
      VeiculoPresentationMapper.toFindAllInput(paginationDto),
    );
  });

  it('finds by placa', async () => {
    const veiculo = makeVeiculo();
    findVeiculoByPlacaUseCase.execute.mockResolvedValue(veiculo);
    const result = await controller.findByPlaca('ABC1234');
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(veiculo.id);
  });

  it('updates a vehicle', async () => {
    const veiculo = makeVeiculo();
    const updateDto = { marca: 'Honda' };
    updateVeiculoUseCase.execute.mockResolvedValue(veiculo);
    await expect(
      controller.update(veiculo.id!, updateDto),
    ).resolves.toEqual({
      success: true,
      message: 'Veículo atualizado com sucesso.',
    });
    expect(updateVeiculoUseCase.execute).toHaveBeenCalledWith(
      veiculo.id,
      VeiculoPresentationMapper.toUpdateInput(updateDto),
    );
  });

  it('removes a vehicle', async () => {
    const veiculo = makeVeiculo();
    removeVeiculoUseCase.execute.mockResolvedValue(veiculo);
    await expect(controller.remove(veiculo.id!)).resolves.toEqual({
      success: true,
      message: 'Veículo removido com sucesso.',
    });
  });
});
