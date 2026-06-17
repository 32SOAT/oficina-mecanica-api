import { HealthController } from './health.controller';
import { CheckHealthUseCase } from '../../application/use-cases/check-health.use-case';

describe('HealthController', () => {
  const checkHealthUseCase = { execute: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns health check result', () => {
    const payload = {
      status: 'ok' as const,
      timestamp: '2023-10-01T12:00:00.000Z',
    };
    checkHealthUseCase.execute.mockReturnValue(payload);

    const controller = new HealthController(
      checkHealthUseCase as unknown as CheckHealthUseCase,
    );

    expect(controller.check()).toEqual(payload);
    expect(checkHealthUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
