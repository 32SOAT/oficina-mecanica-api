import { HealthReadModel } from '../read-models/health-read-model';

export class CheckHealthUseCase {
  execute(): HealthReadModel {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
