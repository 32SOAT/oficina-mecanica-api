import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigType } from '../config/config.module';
import { ClienteTypeormEntity } from '../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import { EstoqueTypeormEntity } from '../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import { HistoricoStatusOsEntity } from '../ordens-de-servico/infrastructure/typeorm/entity/historico-status-os.entity';
import { ItemOsEstoqueEntity } from '../ordens-de-servico/infrastructure/typeorm/entity/item-os-estoque.entity';
import { ItemOsServicoEntity } from '../ordens-de-servico/infrastructure/typeorm/entity/item-os-servico.entity';
import { OrdemServicoTypeormEntity } from '../ordens-de-servico/infrastructure/typeorm/entity/ordem-servico.typeorm.entity';
import { ServicoTypeormEntity } from '../servicos/infrastructure/typeorm/entity/servico.typeorm.entity';
import { UserEntity } from '../users/infrastructure/typeorm/entity/user.typeorm.entity';
import { VeiculoTypeormEntity } from '../veiculos/infrastructure/typeorm/entity/veiculo.typeorm.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigType>) => {
        const databaseConfig = configService.getOrThrow('database', {
          infer: true,
        });

        return {
          ...databaseConfig,
          entities: [
            UserEntity,
            ClienteTypeormEntity,
            VeiculoTypeormEntity,
            ServicoTypeormEntity,
            EstoqueTypeormEntity,
            OrdemServicoTypeormEntity,
            ItemOsServicoEntity,
            ItemOsEstoqueEntity,
            HistoricoStatusOsEntity,
          ],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
