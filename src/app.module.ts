import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { shouldEnableSeedingModule } from './database/seeds/seeding-environment';
import { SeedingModule } from './database/seeds/seeding.module';
import { CoreModule } from './common/core/core.module';
import { HealthModule } from './health/module';
import { ClienteModule } from './clientes/cliente.module';
import { VeiculoModule } from './veiculos/module';
import { UserModule } from './users/module';
import { AuthModule } from './auth/module';
import { ServicoModule } from './servicos/module';
import { EstoqueModule } from './estoque/module';
import { OrdemServicoModule } from './ordens-de-servico/module';

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    DatabaseModule,
    HealthModule,
    ClienteModule,
    UserModule,
    AuthModule,
    VeiculoModule,
    ServicoModule,
    EstoqueModule,
    OrdemServicoModule,
    ...(shouldEnableSeedingModule(process.env.NODE_ENV) ? [SeedingModule] : []),
  ],
})
export class AppModule {}
