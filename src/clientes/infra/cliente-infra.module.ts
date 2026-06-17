import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteTypeormEntity } from './typeorm/cliente.typeorm.entity';
import { ClienteTypeormRepository } from './typeorm/cliente.repository';
import {
  CLIENTE_REPOSITORY,
  ClienteRepository,
} from '../application/ports/cliente.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteTypeormEntity])],
  providers: [
    ClienteTypeormRepository,
    {
      provide: CLIENTE_REPOSITORY,
      useClass: ClienteTypeormRepository,
    },
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClienteInfraModule {}
