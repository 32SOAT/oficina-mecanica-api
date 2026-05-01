import { HttpException, UnauthorizedException } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

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

    await expect(controller.findAll({})).resolves.toBe(result);
    expect(servicoService.findAll).toHaveBeenCalledWith({});
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

  describe('authentication', () => {
    let guard: JwtAuthGuard;
    let jwtService: JwtService;
    let reflector: Reflector;

    beforeEach(() => {
      jwtService = new JwtService({
        secret: 'test-secret',
        signOptions: { expiresIn: '1h' },
      });
      reflector = new Reflector();
      guard = new JwtAuthGuard(jwtService, reflector);
    });

    const routeNames = ['create', 'findAll', 'findOne', 'update', 'remove'];

    const getHandler = (name: string) =>
      Object.getOwnPropertyDescriptor(ServicoController.prototype, name)!
        .value as (...args: unknown[]) => unknown;

    it('no route is marked as @Public()', () => {
      for (const routeName of routeNames) {
        const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
          getHandler(routeName),
          ServicoController,
        ]);
        expect(isPublic).not.toBe(true);
      }
    });

    const createGuardContext = (headers: Record<string, string>) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ headers }),
        }),
        getHandler: () => getHandler(routeNames[0]),
        getClass: () => ServicoController,
      }) as never;

    it('blocks unauthenticated request', async () => {
      const context = createGuardContext({});
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('allows authenticated request with valid token', async () => {
      const token = jwtService.sign({
        sub: 'user-id',
        email: 'admin@test.com',
        username: 'admin',
      });
      const context = createGuardContext({
        authorization: `Bearer ${token}`,
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });
});
