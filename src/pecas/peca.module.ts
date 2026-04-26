import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryingModule } from '../querying/querying.module';
import { PecaController } from './peca.controller';
import { PecaEntity } from './peca.entity';
import { PecaService } from './peca.service';

@Module({
  imports: [TypeOrmModule.forFeature([PecaEntity]), QueryingModule],
  controllers: [PecaController],
  providers: [PecaService],
})
export class PecaModule {}
