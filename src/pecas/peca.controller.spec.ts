import { HttpException } from '@nestjs/common';
import { PecaController } from './peca.controller';
import { PecaService } from './peca.service';
import { PecaEntity } from './peca.entity';
import { TipoOperacaoEstoque } from './dtos/update-estoque.dto';

type PecaServiceMock = jest.Mocked<
  Pick<
    PecaService,
    'create' | 'findAll' | 'findOne' | 'update' | 'updateEstoque' | 'remove'
  >
>;

describe('PecaController', () => {
  let controller: PecaController;
  let pecaService: PecaServiceMock;

  const peca: PecaEntity = Object.assign(new PecaEntity(), {
    id: 1,
    codigo: 'PCA-001',
    pecasInsumos: 'Pastilha de freio',
    quantidadeFisica: 50,
    quantidadeReservada: 5,
    precoUnitario: 89.9,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  beforeEach(() => {
    pecaService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateEstoque: jest.fn(),
      remove: jest.fn(),
    };

    controller = new PecaController(pecaService as unknown as PecaService);
  });

  it('creates a peca', async () => {
    const createPecaDto = {
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      precoUnitario: 89.9,
    };
    pecaService.create.mockResolvedValue(peca);

    await expect(controller.create(createPecaDto)).resolves.toBe(peca);
    expect(pecaService.create).toHaveBeenCalledWith(createPecaDto);
  });

  it('lets create service exceptions propagate to Nest', async () => {
    const error = new HttpException('Invalid data', 400);
    pecaService.create.mockRejectedValue(error);

    await expect(
      controller.create({
        codigo: 'PCA-001',
        pecasInsumos: 'Pastilha de freio',
        quantidadeFisica: 50,
        precoUnitario: 89.9,
      }),
    ).rejects.toBe(error);
  });

  it('lists pecas with pagination', async () => {
    const paginationDto = { page: 2, take: 5 };
    const result = {
      data: [peca],
      meta: {
        itemsPerPage: 5,
        totalItems: 6,
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    };
    pecaService.findAll.mockResolvedValue(result);

    await expect(controller.findAll(paginationDto)).resolves.toBe(result);
    expect(pecaService.findAll).toHaveBeenCalledWith(paginationDto, false);
  });

  it('lists pecas with estoque_baixo filter', async () => {
    const result = { data: [], meta: undefined };
    pecaService.findAll.mockResolvedValue(result);

    await expect(controller.findAll({}, 'true')).resolves.toBe(result);
    expect(pecaService.findAll).toHaveBeenCalledWith({}, true);
  });

  it('finds one peca by id', async () => {
    pecaService.findOne.mockResolvedValue(peca);

    await expect(controller.findOne(1)).resolves.toBe(peca);
    expect(pecaService.findOne).toHaveBeenCalledWith(1);
  });

  it('lets findOne service exceptions propagate to Nest', async () => {
    const error = new HttpException('Peça não encontrada.', 404);
    pecaService.findOne.mockRejectedValue(error);

    await expect(controller.findOne(999)).rejects.toBe(error);
  });

  it('updates a peca', async () => {
    const updatePecaDto = { pecasInsumos: 'Pastilha cerâmica' };
    pecaService.update.mockResolvedValue({ ...peca, ...updatePecaDto });

    await expect(controller.update(1, updatePecaDto)).resolves.toEqual({
      success: true,
      message: 'Peça atualizada com sucesso.',
    });
    expect(pecaService.update).toHaveBeenCalledWith(1, updatePecaDto);
  });

  it('lets update service exceptions propagate to Nest', async () => {
    const error = new HttpException('Peça não encontrada.', 404);
    pecaService.update.mockRejectedValue(error);

    await expect(controller.update(999, {})).rejects.toBe(error);
  });

  it('updates estoque with reserve operation', async () => {
    const updateEstoqueDto = {
      operacao: TipoOperacaoEstoque.RESERVAR,
      quantidade: 5,
    };
    const updatedPeca = Object.assign(new PecaEntity(), {
      ...peca,
      quantidadeReservada: 10,
    });
    pecaService.updateEstoque.mockResolvedValue(updatedPeca);

    const result = await controller.updateEstoque(1, updateEstoqueDto);

    expect(result).toEqual({
      success: true,
      message: 'Estoque atualizado com sucesso.',
      data: updatedPeca,
    });
    expect(pecaService.updateEstoque).toHaveBeenCalledWith(1, updateEstoqueDto);
  });

  it('lets updateEstoque service exceptions propagate to Nest', async () => {
    const error = new HttpException('Estoque insuficiente.', 400);
    pecaService.updateEstoque.mockRejectedValue(error);

    await expect(
      controller.updateEstoque(1, {
        operacao: TipoOperacaoEstoque.RESERVAR,
        quantidade: 100,
      }),
    ).rejects.toBe(error);
  });

  it('removes a peca', async () => {
    pecaService.remove.mockResolvedValue(peca);

    await expect(controller.remove(1)).resolves.toEqual({
      success: true,
      message: 'Peça removida com sucesso.',
    });
    expect(pecaService.remove).toHaveBeenCalledWith(1);
  });

  it('lets remove service exceptions propagate to Nest', async () => {
    const error = new HttpException('Peça não encontrada.', 404);
    pecaService.remove.mockRejectedValue(error);

    await expect(controller.remove(999)).rejects.toBe(error);
  });
});
