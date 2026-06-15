import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryingModule } from '../querying/querying.module';
import { ClienteController } from './presentation/controller/cliente.controller';
import { ClienteTypeormEntity } from './infra/typeorm/cliente.typeorm.entity';
import { ClienteTypeormRepository } from './infra/typeorm/cliente.repository';
import { CLIENTE_REPOSITORY } from './application/cliente-repository.interface';
import { CreateClienteUseCase } from './application/use-cases/create-cliente.use-case';
import { FindAllClientesUseCase } from './application/use-cases/find-all-clientes.use-case';
import { FindClienteByDocumentoUseCase } from './application/use-cases/find-cliente-by-documento.use-case';
import { FindClienteByIdUseCase } from './application/use-cases/find-cliente-by-id.use-case';
import { UpdateClienteUseCase } from './application/use-cases/update-cliente.use-case';
import { RemoveClienteUseCase } from './application/use-cases/remove-cliente.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteTypeormEntity]), QueryingModule],
  controllers: [ClienteController],
  providers: [
    CreateClienteUseCase,
    FindAllClientesUseCase,
    FindClienteByDocumentoUseCase,
    FindClienteByIdUseCase,
    UpdateClienteUseCase,
    RemoveClienteUseCase,
    {
      provide: CLIENTE_REPOSITORY,
      useClass: ClienteTypeormRepository,
    },
  ],
  exports: [FindClienteByDocumentoUseCase],
})
export class ClienteModule {}
