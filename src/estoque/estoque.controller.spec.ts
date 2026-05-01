import { HttpException } from '@nestjs/common';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { EstoqueEntity } from './estoque.entity';
import { TipoOperacaoEstoque } from './dtos/operacao-estoque.dto';

type EstoqueServiceMock = jest.Mocked<
  Pick<
    EstoqueService,
    'create' | 'findAll' | 'findOne' | 'update' | 'executarOperacao' | 'remove'
  >
>;

describe('EstoqueController', () => {
  let controller: EstoqueController;
  let estoqueService: EstoqueServiceMock;

  const item: EstoqueEntity = Object.assign(new EstoqueEntity(), {
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
    estoqueService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      executarOperacao: jest.fn(),
      remove: jest.fn(),
    };

    controller = new EstoqueController(
      estoqueService as unknown as EstoqueService,
    );
  });

  it('creates an item', async () => {
    const createEstoqueDto = {
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha de freio',
      quantidadeFisica: 50,
      precoUnitario: 89.9,
    };
    estoqueService.create.mockResolvedValue(item);

    await expect(controller.create(createEstoqueDto)).resolves.toBe(item);
    expect(estoqueService.create).toHaveBeenCalledWith(createEstoqueDto);
  });

  it('lets create service exceptions propagate to Nest', async () => {
    const error = new HttpException('Invalid data', 400);
    estoqueService.create.mockRejectedValue(error);

    await expect(
      controller.create({
        codigo: 'PCA-001',
        pecasInsumos: 'Pastilha de freio',
        quantidadeFisica: 50,
        precoUnitario: 89.9,
      }),
    ).rejects.toBe(error);
  });

  it('lists items with pagination', async () => {
    const paginationDto = { page: 2, take: 5 };
    const result = {
      data: [item],
      meta: {
        itemsPerPage: 5,
        totalItems: 6,
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    };
    estoqueService.findAll.mockResolvedValue(result);

    await expect(controller.findAll(paginationDto)).resolves.toBe(result);
    expect(estoqueService.findAll).toHaveBeenCalledWith(paginationDto, false);
  });

  it('lists items with estoque_baixo filter', async () => {
    const result = { data: [], meta: undefined };
    estoqueService.findAll.mockResolvedValue(result);

    await expect(controller.findAll({}, 'true')).resolves.toBe(result);
    expect(estoqueService.findAll).toHaveBeenCalledWith({}, true);
  });

  it('finds one item by id', async () => {
    estoqueService.findOne.mockResolvedValue(item);

    await expect(controller.findOne(1)).resolves.toBe(item);
    expect(estoqueService.findOne).toHaveBeenCalledWith(1);
  });

  it('lets findOne service exceptions propagate to Nest', async () => {
    const error = new HttpException('Item de estoque não encontrado.', 404);
    estoqueService.findOne.mockRejectedValue(error);

    await expect(controller.findOne(999)).rejects.toBe(error);
  });

  it('updates an item', async () => {
    const updateEstoqueDto = { pecasInsumos: 'Pastilha cerâmica' };
    estoqueService.update.mockResolvedValue({ ...item, ...updateEstoqueDto });

    await expect(controller.update(1, updateEstoqueDto)).resolves.toEqual({
      success: true,
      message: 'Item de estoque atualizado com sucesso.',
    });
    expect(estoqueService.update).toHaveBeenCalledWith(1, updateEstoqueDto);
  });

  it('lets update service exceptions propagate to Nest', async () => {
    const error = new HttpException('Item de estoque não encontrado.', 404);
    estoqueService.update.mockRejectedValue(error);

    await expect(controller.update(999, {})).rejects.toBe(error);
  });

  it('executes a reserve operation', async () => {
    const operacaoDto = {
      operacao: TipoOperacaoEstoque.RESERVAR,
      quantidade: 5,
    };
    const updated = Object.assign(new EstoqueEntity(), {
      ...item,
      quantidadeReservada: 10,
    });
    estoqueService.executarOperacao.mockResolvedValue(updated);

    const result = await controller.executarOperacao(1, operacaoDto);

    expect(result).toEqual({
      success: true,
      message: 'Operação executada com sucesso.',
      data: updated,
    });
    expect(estoqueService.executarOperacao).toHaveBeenCalledWith(
      1,
      operacaoDto,
    );
  });

  it('lets executarOperacao service exceptions propagate to Nest', async () => {
    const error = new HttpException('Estoque insuficiente.', 400);
    estoqueService.executarOperacao.mockRejectedValue(error);

    await expect(
      controller.executarOperacao(1, {
        operacao: TipoOperacaoEstoque.RESERVAR,
        quantidade: 100,
      }),
    ).rejects.toBe(error);
  });

  it('removes an item', async () => {
    estoqueService.remove.mockResolvedValue(item);

    await expect(controller.remove(1)).resolves.toEqual({
      success: true,
      message: 'Item de estoque removido com sucesso.',
    });
    expect(estoqueService.remove).toHaveBeenCalledWith(1);
  });

  it('lets remove service exceptions propagate to Nest', async () => {
    const error = new HttpException('Item de estoque não encontrado.', 404);
    estoqueService.remove.mockRejectedValue(error);

    await expect(controller.remove(999)).rejects.toBe(error);
  });
});
