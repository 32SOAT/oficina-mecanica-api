import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from './app.config';
import * as Joi from 'joi';

export interface ConfigType {
  app: AppConfig;
  database: TypeOrmModuleOptions;
}

export const appConfigSchema = Joi.object({
  NODE_ENV: Joi.string().default('development'),
  APP_PORT: Joi.number().default(3000),
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().default('5432'),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  DB_SYNC: Joi.number().valid(0, 1).required(),
});
