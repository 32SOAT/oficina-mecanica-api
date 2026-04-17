import { registerAs } from '@nestjs/config';

export interface AppConfig {
  environment: string;
  port: number;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    environment: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.APP_PORT ?? '3000'),
  }),
);
