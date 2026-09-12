import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pino from 'pino';
import { getLoggerOptions } from './logger-options';

describe('logger options', () => {
  const originalEnv = process.env;
  let directory: string;

  beforeEach(() => {
    process.env = { ...originalEnv };
    directory = mkdtempSync(join(tmpdir(), 'oficina-logging-'));
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(directory, { recursive: true, force: true });
  });

  it('keeps production JSON, redacts headers and preserves correlation fields', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_FILE_ENABLED = 'true';
    process.env.LOG_FILE_PATH = join(directory, 'unused', 'api.log');
    const options = getLoggerOptions();
    expect(options.transport).toBeUndefined();
    expect(existsSync(join(directory, 'unused'))).toBe(false);
    let output = '';
    const logger = pino(options, {
      write: (line) => {
        output += line;
      },
    });
    logger.info(
      {
        req: {
          method: 'GET',
          url: '/health',
          headers: { authorization: 'Bearer secret', cookie: 'session=secret' },
        },
        res: { statusCode: 200, headers: { 'set-cookie': ['session=secret'] } },
        correlationId: 'test-correlation',
        dd: { trace_id: '123', span_id: '456' },
      },
      'request completed',
    );
    expect(output).not.toContain('secret');
    expect(JSON.parse(output)).toMatchObject({
      req: {
        method: 'GET',
        url: '/health',
        headers: { authorization: '[REDACTED]', cookie: '[REDACTED]' },
      },
      res: { statusCode: 200, headers: { 'set-cookie': '[REDACTED]' } },
      correlationId: 'test-correlation',
      dd: { trace_id: '123', span_id: '456' },
    });
  });

  it('creates the local directory and configures separate pretty and JSON targets', () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_FILE_ENABLED = 'true';
    const destination = join(directory, 'logs', 'api.log');
    process.env.LOG_FILE_PATH = destination;
    expect(getLoggerOptions().transport).toEqual({
      targets: [
        {
          target: require.resolve('pino-pretty'),
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
        { target: 'pino/file', options: { destination, append: true } },
      ],
    });
    expect(existsSync(join(directory, 'logs'))).toBe(true);
  });
});
