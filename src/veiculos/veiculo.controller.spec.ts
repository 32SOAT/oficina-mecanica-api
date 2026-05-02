import { HttpException, UnauthorizedException } from '@nestjs/common';
import { VeiculoController } from './veiculo.controller';
import { VeiculoService } from './veiculo.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

type VeiculoServiceMock = jest.Mocked<
  Pick<
    VeiculoService,
    'create' | 'findAll' | 'findByPlaca' | 'update' | 'remove'
  >
>;

describe('VeiculoController', () => {
  let controller: VeiculoController;
  let veiculoService: VeiculoServiceMock;

  const cliente = {
    id: 'cliente-id',
    documento: '39053344705',
    nome: 'Jane Doe',
    email: 'jane@example.com',
    celularNumero: '11999999999',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const veiculo = {
    id: 'veiculo-id',
    placa: 'ABC1234',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    cliente_id: cliente.id,
    cliente,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    veiculoService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPlaca: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new VeiculoController(
      veiculoService as unknown as VeiculoService,
    );
  });

  it('creates a vehicle', async () => {
    const createVeiculoDto = {
      placa: 'ABC1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      documentoCliente: cliente.documento,
    };
    veiculoService.create.mockResolvedValue(veiculo);

    await expect(controller.create(createVeiculoDto)).resolves.toBe(veiculo);
    expect(veiculoService.create).toHaveBeenCalledWith(createVeiculoDto);
  });

  it('lets create service exceptions propagate to Nest', async () => {
    const error = new HttpException('Invalid data', 400);
    veiculoService.create.mockRejectedValue(error);

    await expect(
      controller.create({
        placa: 'invalid',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        documentoCliente: 'invalid',
      }),
    ).rejects.toBe(error);
  });

  it('lists vehicles with pagination', async () => {
    const paginationDto = {
      page: 2,
      take: 5,
    };
    const result = {
      data: [veiculo],
      meta: {
        itemsPerPage: 5,
        totalItems: 6,
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    };
    veiculoService.findAll.mockResolvedValue(result);

    await expect(controller.findAll(paginationDto)).resolves.toBe(result);
    expect(veiculoService.findAll).toHaveBeenCalledWith(paginationDto);
  });

  it('lists vehicles with default pagination when no query is provided', async () => {
    const result = {
      data: [veiculo],
      meta: {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    veiculoService.findAll.mockResolvedValue(result);

    await expect(controller.findAll({})).resolves.toBe(result);
    expect(veiculoService.findAll).toHaveBeenCalledWith({});
  });

  it('finds one vehicle by placa', async () => {
    const placa = veiculo.placa;
    veiculoService.findByPlaca.mockResolvedValue(veiculo);

    await expect(controller.findByPlaca(placa)).resolves.toEqual({
      success: true,
      data: veiculo,
      message: 'Veículo encontrado com sucesso.',
    });
    expect(veiculoService.findByPlaca).toHaveBeenCalledWith(placa);
  });

  it('lets findByPlaca service exceptions propagate to Nest', async () => {
    const error = new HttpException('Vehicle Not Found', 404);
    veiculoService.findByPlaca.mockRejectedValue(error);

    await expect(controller.findByPlaca('INVALID')).rejects.toBe(error);
  });

  it('updates a vehicle', async () => {
    const updateVeiculoDto = {
      marca: 'Honda',
    };
    veiculoService.update.mockResolvedValue(veiculo);

    await expect(
      controller.update(veiculo.id, updateVeiculoDto),
    ).resolves.toEqual({
      success: true,
      message: 'Veículo atualizado com sucesso.',
    });
    expect(veiculoService.update).toHaveBeenCalledWith(
      veiculo.id,
      updateVeiculoDto,
    );
  });

  it('lets update service exceptions propagate to Nest', async () => {
    const error = new HttpException('Vehicle Not Found', 404);
    veiculoService.update.mockRejectedValue(error);

    await expect(controller.update('missing-id', {})).rejects.toBe(error);
  });

  it('removes a vehicle', async () => {
    veiculoService.remove.mockResolvedValue(veiculo);

    await expect(controller.remove(veiculo.id)).resolves.toEqual({
      success: true,
      message: 'Veículo removido com sucesso.',
    });
    expect(veiculoService.remove).toHaveBeenCalledWith(veiculo.id);
  });

  it('lets remove service exceptions propagate to Nest', async () => {
    const error = new HttpException('Vehicle Not Found', 404);
    veiculoService.remove.mockRejectedValue(error);

    await expect(controller.remove('missing-id')).rejects.toBe(error);
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

    const routeNames = ['create', 'findAll', 'findByPlaca', 'update', 'remove'];

    const getHandler = (name: string) =>
      Object.getOwnPropertyDescriptor(VeiculoController.prototype, name)!
        .value as (...args: unknown[]) => unknown;

    it('no route is marked as @Public()', () => {
      for (const routeName of routeNames) {
        const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
          getHandler(routeName),
          VeiculoController,
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
        getClass: () => VeiculoController,
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
