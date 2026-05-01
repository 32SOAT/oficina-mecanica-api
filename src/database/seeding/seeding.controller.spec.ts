import { Test, TestingModule } from '@nestjs/testing';
import { SeedingController } from './seeding.controller';
import { SeedingService } from './seeding.service';

describe('SeedingController', () => {
  let controller: SeedingController;
  const seedMock = jest.fn();

  beforeEach(async () => {
    seedMock.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedingController],
      providers: [
        {
          provide: SeedingService,
          useValue: {
            seed: seedMock,
          },
        },
      ],
    }).compile();

    controller = module.get<SeedingController>(SeedingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns wrapped seed summary response', async () => {
    seedMock.mockResolvedValue({
      message: 'ok',
      clientes: { count: 2, data: [] },
      veiculos: { count: 2 },
      servicos: { count: 5 },
      estoque: { count: 5 },
    });

    const result = await controller.seed();

    expect(result).toEqual({
      success: true,
      message: 'ok',
      data: {
        clientes: { count: 2 },
        veiculos: { count: 2 },
        servicos: { count: 5 },
        estoque: { count: 5 },
      },
    });
  });
});
