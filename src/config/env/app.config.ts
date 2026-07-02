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
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM: Joi.string().email().default('onboarding@resend.dev'),
  RESEND_DEV_REDIRECT_TO: Joi.string().email().optional(),
  NOTIFICACAO_EMAIL_MECANICOS: Joi.string().email().required(),
  NOTIFICACAO_EMAIL_ADMIN: Joi.string().email().required(),
});
