import type { LoggerOptions } from 'pino';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function getLoggerOptions(): LoggerOptions {
  const options: LoggerOptions = {
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["set-cookie"]',
        'res.headers["set-cookie"]',
        'res.headers.authorization',
        'res.headers.cookie',
        'headers.authorization',
        'headers.cookie',
        'headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },
  };
  if (process.env.NODE_ENV === 'production') return options;

  const targets = [
    {
      target: require.resolve('pino-pretty'),
      options: { colorize: true, translateTime: 'SYS:standard' },
    },
  ];
  if (process.env.LOG_FILE_ENABLED === 'true') {
    const destination = resolve(process.env.LOG_FILE_PATH || './logs/api.log');
    mkdirSync(dirname(destination), { recursive: true, mode: 0o750 });
    options.transport = {
      targets: [
        ...targets,
        { target: 'pino/file', options: { destination, append: true } },
      ],
    };
  } else {
    options.transport = targets[0];
  }
  return options;
}
