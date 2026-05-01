import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { TransformResponseInterceptor } from '../src/interceptors/transform-response.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let appService: jest.Mocked<Pick<AppService, 'check'>>;
  const healthPayload = {
    status: 'ok',
    timestamp: '2023-10-01T12:00:00.000Z',
  };

  beforeEach(async () => {
    appService = {
      check: jest.fn().mockReturnValue(healthPayload),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
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
