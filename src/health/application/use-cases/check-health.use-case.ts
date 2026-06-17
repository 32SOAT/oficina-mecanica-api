import { HealthOutput } from '../dto/health.output';

export class CheckHealthUseCase {
  execute(): HealthOutput {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
