import { Controller, Get, INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger as PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import type { App } from 'supertest/types';
import { configureApp } from '../bootstrap/configure-app';
import { CoreModule } from './core.module';

@Controller('logging-test')
class LoggingTestController {
  private readonly logger = new Logger(LoggingTestController.name);

  @Get()
  get() {
    this.logger.log('Request handled');
    return { ok: true };
  }
}

describe('CoreModule HTTP logging', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let app: INestApplication<App>;
  let output: string[];
  let stdoutSpy: jest.SpyInstance;

  beforeEach(async () => {
    process.env.NODE_ENV = 'production';
    output = [];
    stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk) => {
        output.push(String(chunk));
        return true;
      });
    const module = await Test.createTestingModule({
      imports: [CoreModule],
      controllers: [LoggingTestController],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.useLogger(app.get(PinoLogger));
    configureApp(app);
    await app.init();
    output.length = 0;
  });

  afterEach(async () => {
    await app?.close();
    stdoutSpy.mockRestore();
    Logger.overrideLogger(false);
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  function logs() {
    return output
      .join('')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  }

  it('reuses the header in JSON HTTP and Nest logs and preserves the response', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/logging-test')
      .set('x-correlation-id', 'client-request-123')
      .expect('x-correlation-id', 'client-request-123')
      .expect(200, { data: { ok: true } });

    expect(logs()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          correlationId: 'client-request-123',
          context: 'LoggingTestController',
          msg: 'Request handled',
        }),
        expect.objectContaining({
          correlationId: 'client-request-123',
          msg: 'request completed',
          res: expect.objectContaining({ statusCode: 200 }) as unknown,
        }),
      ]),
    );
  });

  it('generates distinct UUIDs and keeps concurrent requests isolated', async () => {
    const responses = await Promise.all([
      request(app.getHttpServer()).get('/api/v1/logging-test'),
      request(app.getHttpServer()).get('/api/v1/logging-test'),
    ]);
    const ids = responses.map(
      (response) => response.headers['x-correlation-id'],
    );
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(logs().filter((log) => log.correlationId === id)).toHaveLength(2);
    }
  });

  it('includes the correlation ID on unmatched routes', async () => {
    await request(app.getHttpServer())
      .get('/missing')
      .set('x-correlation-id', 'missing-request')
      .expect('x-correlation-id', 'missing-request')
      .expect(404);
    expect(logs()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          correlationId: 'missing-request',
          res: expect.objectContaining({ statusCode: 404 }) as unknown,
        }),
      ]),
    );
  });
});
