import { AppDataSource } from './app-data-source';
import { appConfig } from './app.config';
import { appConfigSchema } from './config.types';
import { getDatabaseOptions, typeOrmConfig } from './database.config';
import { jwtConfig } from './jwt.config';
import { TypedConfigService } from './typed-config.service';

describe('Config files', () => {
  it('builds app config from environment', () => {
    process.env.NODE_ENV = 'development';
    process.env.APP_PORT = '4000';

    const value = (
      appConfig as unknown as () => {
        environment: string;
        port: number;
      }
    )();

    expect(value.environment).toBe('development');
    expect(value.port).toBe(4000);
  });

  it('builds jwt config with default expiresIn', () => {
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.JWT_EXPIRES_IN;
    const value = (
      jwtConfig as unknown as () => { secret: string; expiresIn: string }
    )();
    expect(value.secret).toBe('test-secret');
    expect(value.expiresIn).toBe('1h');
  });

  it('builds jwt config with JWT_EXPIRES_IN from env', () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
    const value = (
      jwtConfig as unknown as () => { secret: string; expiresIn: string }
    )();
    expect(value.expiresIn).toBe('7d');
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

    const fromRegisterAs = (
      typeOrmConfig as unknown as typeof getDatabaseOptions
    )();
    expect(fromRegisterAs).toEqual(options);
  });

  it('validates env with joi schema', () => {
    const validated = appConfigSchema.validate({
      NODE_ENV: 'development',
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_DB: 'oficina',
      POSTGRES_SYNC: 1,
      JWT_SECRET: 'test-jwt-secret-for-validation',
    });
    const error = validated.error;
    const value = validated.value as {
      APP_PORT: number;
      POSTGRES_HOST: string;
    };

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
