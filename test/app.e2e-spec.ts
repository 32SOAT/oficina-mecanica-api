import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { HealthController } from '../src/health/presentation/controllers/health.controller';
import { CheckHealthUseCase } from '../src/health/application/use-cases/check-health.use-case';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;
  const checkHealthUseCase = { execute: jest.fn() };
  const healthPayload = {
    status: 'ok' as const,
    timestamp: '2023-10-01T12:00:00.000Z',
  };

  beforeEach(async () => {
    checkHealthUseCase.execute.mockReturnValue(healthPayload);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: CheckHealthUseCase,
          useValue: checkHealthUseCase,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: TransformResponseInterceptor,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({
        data: healthPayload,
      });
  });
});
