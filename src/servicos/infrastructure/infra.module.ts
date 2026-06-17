import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SERVICO_REPOSITORY } from '../application/ports/servico.repository';
import { ServicoTypeormEntity } from './typeorm/entity/servico.typeorm.entity';
import { ServicoTypeormRepository } from './typeorm/repository/servico.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ServicoTypeormEntity])],
  providers: [
    ServicoTypeormRepository,
    { provide: SERVICO_REPOSITORY, useClass: ServicoTypeormRepository },
  ],
  exports: [SERVICO_REPOSITORY],
})
export class ServicoInfraModule {}
