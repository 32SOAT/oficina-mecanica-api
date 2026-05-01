import { AppDataSource } from './app-data-source';
import { appConfig } from './app.config';
import { appConfigSchema } from './config.types';
import { getDatabaseOptions, typeOrmConfig } from './database.config';
import { TypedConfigService } from './typed-config.service';

describe('Config files', () => {
  it('builds app config from environment', () => {
    process.env.NODE_ENV = 'development';
    process.env.APP_PORT = '4000';

    const value = (appConfig as unknown as () => {
      environment: string;
      port: number;
    })();

    expect(value.environment).toBe('development');
    expect(value.port).toBe(4000);
  });

  it('builds database options and registerAs wrapper', () => {
    process.env.POSTGRES_HOST = 'db';
    process.env.POSTGRES_PORT = '5432';
    process.env.POSTGRES_USER = 'postgres';
    process.env.POSTGRES_PASSWORD = 'postgres';
    process.env.POSTGRES_DB = 'oficina';
    process.env.POSTGRES_SYNC = '1';

    const options = getDatabaseOptions();
    expect(options).toMatchObject({
      host: 'db',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'oficina',
      synchronize: true,
    });

    const dbOptions = (typeOrmConfig as unknown as () => ReturnType<
      typeof getDatabaseOptions
    >)();
    expect(dbOptions.host).toBe('db');
  });

  it('validates env with joi schema', () => {
    const { error, value } = appConfigSchema.validate({
      NODE_ENV: 'development',
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_DB: 'oficina',
      POSTGRES_SYNC: 1,
    });

    expect(error).toBeUndefined();
    expect(value.APP_PORT).toBe(3000);
    expect(value.POSTGRES_HOST).toBe('localhost');
  });

  it('exposes app datasource and typed config service class', () => {
    expect(AppDataSource).toBeDefined();
    expect(AppDataSource.options).toHaveProperty('migrations');
    expect(TypedConfigService).toBeDefined();
  });
});
