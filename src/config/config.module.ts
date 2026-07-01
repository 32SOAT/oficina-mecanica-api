import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { appConfig, envValidationSchema, AppConfig } from './env/app.config';
import { typeOrmConfig } from './env/database.config';
import { jwtConfig, JwtConfig } from './env/jwt.config';
import { resendConfig, ResendConfig } from './env/resend.config';

export interface ConfigType {
  app: AppConfig;
  database: TypeOrmModuleOptions;
  jwt: JwtConfig;
  resend: ResendConfig;
}

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [appConfig, typeOrmConfig, jwtConfig, resendConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
      isGlobal: true,
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
