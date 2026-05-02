import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { type ConfigType, appConfigSchema } from './config/config.types';
import { typeOrmConfig } from './config/database.config';
import { TypedConfigService } from './config/typed-config.service';
import { ClienteEntity } from './clientes/cliente.entity';
import { ClienteModule } from './clientes/cliente.module';
import { EstoqueEntity } from './estoque/estoque.entity';
import { EstoqueModule } from './estoque/estoque.module';
import { ServicoEntity } from './servicos/servico.entity';
import { ServicoModule } from './servicos/servico.module';
import { UserEntity } from './users/user.entity';
import { UserModule } from './users/user.module';
import { VeiculoEntity } from './veiculos/veiculo.entity';
import { VeiculoModule } from './veiculos/veiculo.module';
import { OrdemServicoEntity } from './ordens-de-servico/ordem-servico.entity';
import { ItemOsServicoEntity } from './ordens-de-servico/entities/item-os-servico.entity';
import { ItemOsEstoqueEntity } from './ordens-de-servico/entities/item-os-estoque.entity';
import { HistoricoStatusOsEntity } from './ordens-de-servico/entities/historico-status-os.entity';
import { OrdemServicoModule } from './ordens-de-servico/ordem-servico.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { QueryingModule } from './querying/querying.module';
import { SeedingModule } from './database/seeding/seeding.module';
import { shouldEnableSeedingModule } from './database/seeding/seeding-environment';

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
          entities: [
            ClienteEntity,
            ServicoEntity,
            VeiculoEntity,
            EstoqueEntity,
            UserEntity,
            OrdemServicoEntity,
            ItemOsServicoEntity,
            ItemOsEstoqueEntity,
            HistoricoStatusOsEntity,
          ],
        };
      },
    }),
    ConfigModule.forRoot({
      load: [appConfig, typeOrmConfig],
      validationSchema: appConfigSchema,
      validationOptions: {
        abortEarly: true,
      },
      isGlobal: true,
    }),
    ClienteModule,
    EstoqueModule,
    ServicoModule,
    UserModule,
    VeiculoModule,
    OrdemServicoModule,
    QueryingModule,
    ...(shouldEnableSeedingModule(process.env.NODE_ENV) ? [SeedingModule] : []),
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
