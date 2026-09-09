import type { LoggerOptions } from 'pino';

export function getLoggerOptions(): LoggerOptions {
  return process.env.NODE_ENV === 'production'
    ? {}
    : {
        transport: {
          target: require.resolve('pino-pretty'),
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      };
}
