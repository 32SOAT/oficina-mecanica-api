import { Module } from '@nestjs/common';
import { QueryingModule } from '../querying/querying.module';
import { ClienteController } from './presentation/controller/cliente.controller';
import { CreateClienteUseCase } from './application/use-cases/create-cliente.use-case';
import { FindAllClientesUseCase } from './application/use-cases/find-all-clientes.use-case';
import { FindClienteByDocumentoUseCase } from './application/use-cases/find-cliente-by-documento.use-case';
import { FindClienteByIdUseCase } from './application/use-cases/find-cliente-by-id.use-case';
import { UpdateClienteUseCase } from './application/use-cases/update-cliente.use-case';
import { RemoveClienteUseCase } from './application/use-cases/remove-cliente.use-case';
import { ClienteInfraModule } from './infra/cliente-infra.module';

@Module({
  imports: [QueryingModule, ClienteInfraModule],
  controllers: [ClienteController],
  providers: [
    CreateClienteUseCase,
    FindAllClientesUseCase,
    FindClienteByDocumentoUseCase,
    FindClienteByIdUseCase,
    UpdateClienteUseCase,
    RemoveClienteUseCase,
  ],
})
export class ClienteModule {}
