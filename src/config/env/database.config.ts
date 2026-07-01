import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseOptions = (): TypeOrmModuleOptions => {
  const ssl =
    process.env.POSTGRES_SSL === '1'
      ? {
          ssl: {
            rejectUnauthorized:
              process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === '1',
          },
        }
      : {};

  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number.parseInt(process.env.POSTGRES_PORT ?? '5432'),
    username: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'oficina_mecanica',
    synchronize: process.env.POSTGRES_SYNC === '1',
    ...ssl,
  };
};

export const typeOrmConfig = registerAs('database', getDatabaseOptions);
