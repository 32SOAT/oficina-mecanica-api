import { HttpException } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';

type ServicoServiceMock = jest.Mocked<
  Pick<ServicoService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
>;

describe('ServicoController', () => {
  let controller: ServicoController;
  let servicoService: ServicoServiceMock;

  const servico = {
    id: 1,
    servico: 'Troca de óleo',
    descricao: 'Troca de óleo e filtro',
    precoMaoDeObra: 150.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    servicoService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new ServicoController(
      servicoService as unknown as ServicoService,
    );
  });

  it('creates a servico', async () => {
    const createServicoDto = {
      servico: 'Troca de óleo',
      descricao: 'Troca de óleo e filtro',
      precoMaoDeObra: 150.5,
    };
    servicoService.create.mockResolvedValue(servico);

    await expect(controller.create(createServicoDto)).resolves.toBe(servico);
    expect(servicoService.create).toHaveBeenCalledWith(createServicoDto);
  });

  it('propagates create service exceptions to Nest', async () => {
    const error = new HttpException('Invalid data', 400);
    servicoService.create.mockRejectedValue(error);

    await expect(
      controller.create({
        servico: '',
        precoMaoDeObra: -50,
      }),
    ).rejects.toBe(error);
  });

  it('lists servicos with pagination', async () => {
    const paginationDto = {
      page: 1,
      take: 10,
    };
    const result = {
      data: [servico],
      meta: {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    servicoService.findAll.mockResolvedValue(result);

    await expect(controller.findAll(paginationDto)).resolves.toBe(result);
    expect(servicoService.findAll).toHaveBeenCalledWith(paginationDto);
  });

  it('lists servicos with default pagination', async () => {
    const result = {
      data: [servico],
      meta: {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    servicoService.findAll.mockResolvedValue(result);

    await expect(controller.findAll({} as any)).resolves.toBe(result);
    expect(servicoService.findAll).toHaveBeenCalledWith({} as any);
  });

  it('finds one servico by id', async () => {
    servicoService.findOne.mockResolvedValue(servico);

    await expect(controller.findOne(servico.id)).resolves.toEqual({
      success: true,
      data: servico,
      message: 'Serviço encontrado com sucesso.',
    });
    expect(servicoService.findOne).toHaveBeenCalledWith(servico.id);
  });

  it('propagates findOne service exceptions to Nest', async () => {
    const error = new HttpException('Serviço não encontrado', 404);
    servicoService.findOne.mockRejectedValue(error);

    await expect(controller.findOne(999)).rejects.toBe(error);
  });

  it('updates a servico', async () => {
    const updateServicoDto = {
      descricao: 'Nova descrição',
    };
    servicoService.update.mockResolvedValue(servico);

    await expect(
      controller.update(servico.id, updateServicoDto),
    ).resolves.toEqual({
      success: true,
      message: 'Serviço atualizado com sucesso.',
    });
    expect(servicoService.update).toHaveBeenCalledWith(
      servico.id,
      updateServicoDto,
    );
  });

  it('propagates update service exceptions to Nest', async () => {
    const error = new HttpException('Serviço não encontrado', 404);
    servicoService.update.mockRejectedValue(error);

    await expect(controller.update(999, {})).rejects.toBe(error);
  });

  it('removes a servico', async () => {
    servicoService.remove.mockResolvedValue(servico);

    await expect(controller.remove(servico.id)).resolves.toEqual({
      success: true,
      message: 'Serviço removido com sucesso.',
    });
    expect(servicoService.remove).toHaveBeenCalledWith(servico.id);
  });

  it('propagates remove service exceptions to Nest', async () => {
    const error = new HttpException('Serviço não encontrado', 404);
    servicoService.remove.mockRejectedValue(error);

    await expect(controller.remove(999)).rejects.toBe(error);
  });
});
