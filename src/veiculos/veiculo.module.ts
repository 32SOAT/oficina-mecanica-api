import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteModule } from '../clientes/cliente.module';
import { QueryingModule } from '../querying/querying.module';
import { VeiculoController } from './veiculo.controller';
import { VeiculoEntity } from './veiculo.entity';
import { VeiculoService } from './veiculo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VeiculoEntity]),
    ClienteModule,
    QueryingModule,
  ],
  controllers: [VeiculoController],
  providers: [VeiculoService],
  exports: [VeiculoService],
})
export class VeiculoModule {}