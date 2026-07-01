import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export interface AppConfig {
  environment: string;
  port: number;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    environment: process.env.NODE_ENV ?? 'development',
    port: Number.parseInt(process.env.APP_PORT ?? '3000'),
  }),
);

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  APP_PORT: Joi.number().default(3000),
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_SYNC: Joi.number().valid(0, 1).required(),
  POSTGRES_SSL: Joi.number().valid(0, 1).default(0),
  POSTGRES_SSL_REJECT_UNAUTHORIZED: Joi.number().valid(0, 1).default(0),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
});
