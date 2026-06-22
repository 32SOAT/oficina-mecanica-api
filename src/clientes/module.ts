import { Module } from '@nestjs/common';
import { ClienteController } from './presentation/controllers/cliente.controller';
import { CreateClienteUseCase } from './application/use-cases/create-cliente.use-case';
import { FindAllClientesUseCase } from './application/use-cases/find-all-clientes.use-case';
import { FindClienteByDocumentoUseCase } from './application/use-cases/find-cliente-by-documento.use-case';
import { UpdateClienteUseCase } from './application/use-cases/update-cliente.use-case';
import { RemoveClienteUseCase } from './application/use-cases/remove-cliente.use-case';
import { ClienteInfraModule } from './infrastructure/infra.module';

@Module({
  imports: [ClienteInfraModule],
  controllers: [ClienteController],
  providers: [
    CreateClienteUseCase,
    FindAllClientesUseCase,
    FindClienteByDocumentoUseCase,
    UpdateClienteUseCase,
    RemoveClienteUseCase,
  ],
})
export class ClienteModule {}
