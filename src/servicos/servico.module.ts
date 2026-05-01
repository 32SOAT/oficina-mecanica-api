import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryingModule } from '../querying/querying.module';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';
import { ServicoEntity } from './servico.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServicoEntity]), QueryingModule],
  controllers: [ServicoController],
  providers: [ServicoService],
  exports: [ServicoService],
})
export class ServicoModule {}
