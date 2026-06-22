import { ServicoController } from './servico.controller';
import { CreateServicoUseCase } from '../../application/use-cases/create-servico.use-case';
import { FindAllServicosUseCase } from '../../application/use-cases/find-all-servicos.use-case';
import { FindServicoByIdUseCase } from '../../application/use-cases/find-servico-by-id.use-case';
import { UpdateServicoUseCase } from '../../application/use-cases/update-servico.use-case';
import { RemoveServicoUseCase } from '../../application/use-cases/remove-servico.use-case';
import { ServicoPresentationMapper } from '../mappers/servico-presentation.mapper';

const output = {
  id: 1,
  servico: 'Troca de óleo',
  descricao: 'Troca de óleo e filtro',
  precoMaoDeObra: 150.5,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('ServicoController', () => {
  let controller: ServicoController;
  const createServicoUseCase = { execute: jest.fn() };
  const findAllServicosUseCase = { execute: jest.fn() };
  const findServicoByIdUseCase = { execute: jest.fn() };
  const updateServicoUseCase = { execute: jest.fn() };
  const removeServicoUseCase = { execute: jest.fn() };

  beforeEach(() => {
    controller = new ServicoController(
      createServicoUseCase as unknown as CreateServicoUseCase,
      findAllServicosUseCase as unknown as FindAllServicosUseCase,
      findServicoByIdUseCase as unknown as FindServicoByIdUseCase,
      updateServicoUseCase as unknown as UpdateServicoUseCase,
      removeServicoUseCase as unknown as RemoveServicoUseCase,
    );
  });

  it('creates a servico', async () => {
    const dto = {
      servico: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      precoMaoDeObra: 150.5,
    };
    createServicoUseCase.execute.mockResolvedValue(output);
    const result = await controller.create(dto);
    expect(result.id).toBe(output.id);
    expect(createServicoUseCase.execute).toHaveBeenCalledWith(
      ServicoPresentationMapper.toCreateInput(dto),
    );
  });

  it('lists servicos', async () => {
    const paginationDto = { page: 1, take: 10 };
    findAllServicosUseCase.execute.mockResolvedValue({
      data: [output],
      meta: { currentPage: 1 },
    });
    const result = await controller.findAll(paginationDto);
    expect(result.data).toHaveLength(1);
    expect(findAllServicosUseCase.execute).toHaveBeenCalledWith(
      ServicoPresentationMapper.toFindAllInput(paginationDto),
    );
  });

  it('finds by id', async () => {
    findServicoByIdUseCase.execute.mockResolvedValue(output);
    const result = await controller.findOne(output.id);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(output.id);
  });

  it('updates a servico', async () => {
    const dto = { descricao: 'Nova descrição' };
    updateServicoUseCase.execute.mockResolvedValue(output);
    await expect(controller.update(output.id, dto)).resolves.toEqual({
      success: true,
      message: 'Serviço atualizado com sucesso.',
    });
    expect(updateServicoUseCase.execute).toHaveBeenCalledWith(
      output.id,
      ServicoPresentationMapper.toUpdateInput(dto),
    );
  });

  it('removes a servico', async () => {
    removeServicoUseCase.execute.mockResolvedValue(output);
    await expect(controller.remove(output.id)).resolves.toEqual({
      success: true,
      message: 'Serviço removido com sucesso.',
    });
  });
});
