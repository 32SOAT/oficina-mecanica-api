import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdemServicoModule } from '../ordens-de-servico/ordem-servico.module';
import { QueryingModule } from '../querying/querying.module';
import { EstoqueController } from './estoque.controller';
import { EstoqueEntity } from './estoque.entity';
import { EstoqueService } from './estoque.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EstoqueEntity]),
    QueryingModule,
    OrdemServicoModule,
  ],
  controllers: [EstoqueController],
  providers: [EstoqueService],
})
export class EstoqueModule {}
