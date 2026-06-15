import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { type ConfigType, appConfigSchema } from './config/config.types';
import { typeOrmConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { TypedConfigService } from './config/typed-config.service';
import { ClienteModule } from './clientes/cliente.module';
import { UserEntity } from './users/user.entity';
import { UserModule } from './users/user.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { QueryingModule } from './querying/querying.module';
import { AuthModule } from './auth/auth.module';
import { ClienteTypeormEntity } from './clientes/infra/typeorm/cliente.typeorm.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigType>) => {
        const databaseConfig: ConfigType['database'] = configService.getOrThrow(
          'database',
          { infer: true },
        );

        return {
          ...databaseConfig,
          entities: [UserEntity, ClienteTypeormEntity],
        };
      },
    }),
    ConfigModule.forRoot({
      load: [appConfig, typeOrmConfig, jwtConfig],
      validationSchema: appConfigSchema,
      validationOptions: {
        abortEarly: true,
      },
      isGlobal: true,
    }),
    ClienteModule,
    UserModule,
    AuthModule,
    QueryingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: TypedConfigService,
      useExisting: ConfigService,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}
