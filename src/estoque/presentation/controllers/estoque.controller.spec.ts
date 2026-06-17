import { BadRequestException, HttpStatus } from '@nestjs/common';
import { EstoqueController } from './estoque.controller';
import { CreateEstoqueUseCase } from '../../application/use-cases/create-estoque.use-case';
import { FindAllEstoquesUseCase } from '../../application/use-cases/find-all-estoques.use-case';
import { FindEstoqueByIdUseCase } from '../../application/use-cases/find-estoque-by-id.use-case';
import { UpdateEstoqueUseCase } from '../../application/use-cases/update-estoque.use-case';
import { RegistrarReposicaoEstoqueUseCase } from '../../application/use-cases/registrar-reposicao-estoque.use-case';
import { ExecutarOperacaoEstoqueUseCase } from '../../application/use-cases/executar-operacao-estoque.use-case';
import { RemoveEstoqueUseCase } from '../../application/use-cases/remove-estoque.use-case';
import { TipoOperacaoEstoque } from '../../application/dto/tipo-operacao-estoque';
import { EstoquePresentationMapper } from '../mappers/estoque-presentation.mapper';

const output = {
  id: 1,
  codigo: 'PCA-001',
  pecasInsumos: 'Pastilha',
  quantidadeFisica: 10,
  quantidadeReservada: 0,
  quantidadeDisponivel: 10,
  precoUnitario: 89.9,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('EstoqueController', () => {
  let controller: EstoqueController;
  const createEstoqueUseCase = { execute: jest.fn() };
  const findAllEstoquesUseCase = { execute: jest.fn() };
  const findEstoqueByIdUseCase = { execute: jest.fn() };
  const updateEstoqueUseCase = { execute: jest.fn() };
  const registrarReposicaoEstoqueUseCase = { execute: jest.fn() };
  const executarOperacaoEstoqueUseCase = { execute: jest.fn() };
  const removeEstoqueUseCase = { execute: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new EstoqueController(
      createEstoqueUseCase as unknown as CreateEstoqueUseCase,
      findAllEstoquesUseCase as unknown as FindAllEstoquesUseCase,
      findEstoqueByIdUseCase as unknown as FindEstoqueByIdUseCase,
      updateEstoqueUseCase as unknown as UpdateEstoqueUseCase,
      registrarReposicaoEstoqueUseCase as unknown as RegistrarReposicaoEstoqueUseCase,
      executarOperacaoEstoqueUseCase as unknown as ExecutarOperacaoEstoqueUseCase,
      removeEstoqueUseCase as unknown as RemoveEstoqueUseCase,
    );
  });

  it('creates estoque', async () => {
    const dto = {
      codigo: 'PCA-001',
      pecasInsumos: 'Pastilha',
      quantidadeFisica: 10,
      precoUnitario: 89.9,
    };
    createEstoqueUseCase.execute.mockResolvedValue(output);
    const result = await controller.create(dto);
    expect(result.codigo).toBe('PCA-001');
    expect(createEstoqueUseCase.execute).toHaveBeenCalledWith(
      EstoquePresentationMapper.toCreateInput(dto),
    );
  });

  it('lists estoque', async () => {
    findAllEstoquesUseCase.execute.mockResolvedValue({
      data: [output],
      meta: { currentPage: 1 },
    });
    const result = await controller.findAll({ page: 1, take: 10 }, 'true');
    expect(result.data).toHaveLength(1);
  });

  it('finds by id', async () => {
    findEstoqueByIdUseCase.execute.mockResolvedValue(output);
    const result = await controller.findOne(1);
    expect(result.codigo).toBe('PCA-001');
  });

  it('updates cadastro fields', async () => {
    updateEstoqueUseCase.execute.mockResolvedValue(output);
    const result = await controller.update(1, { codigo: 'PCA-002' });
    expect(result.success).toBe(true);
  });

  it('rejects quantity fields on update', async () => {
    await expect(
      controller.update(1, { quantidadeFisica: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      controller.update(1, { quantidadeReservada: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      controller.update(1, { quantidadeResrvada: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('executes reposicao with 201', async () => {
    const res = { status: jest.fn() };
    registrarReposicaoEstoqueUseCase.execute.mockResolvedValue(output);
    const result = await controller.executarOperacao(
      res as never,
      { user: { sub: 'user-id' } } as never,
      1,
      { operacao: TipoOperacaoEstoque.REPOSICAO, quantidade: 5 },
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(result.message).toContain('Reposição');
  });

  it('executes reservar/baixa', async () => {
    const res = { status: jest.fn() };
    executarOperacaoEstoqueUseCase.execute.mockResolvedValue(output);
    const result = await controller.executarOperacao(
      res as never,
      { user: { sub: 'user-id' } } as never,
      1,
      { operacao: TipoOperacaoEstoque.RESERVAR, quantidade: 2 },
    );
    expect(result.success).toBe(true);
  });

  it('removes estoque', async () => {
    removeEstoqueUseCase.execute.mockResolvedValue(output);
    const result = await controller.remove(1);
    expect(result.success).toBe(true);
  });
});
