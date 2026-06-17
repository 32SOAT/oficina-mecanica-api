import { Module } from '@nestjs/common';
import { CreateVeiculoUseCase } from './application/use-cases/create-veiculo.use-case';
import { FindAllVeiculosUseCase } from './application/use-cases/find-all-veiculos.use-case';
import { FindVeiculoByPlacaUseCase } from './application/use-cases/find-veiculo-by-placa.use-case';
import { UpdateVeiculoUseCase } from './application/use-cases/update-veiculo.use-case';
import { RemoveVeiculoUseCase } from './application/use-cases/remove-veiculo.use-case';
import { VeiculoInfraModule } from './infrastructure/infra.module';
import { VeiculoController } from './presentation/controllers/veiculo.controller';

@Module({
  imports: [VeiculoInfraModule],
  controllers: [VeiculoController],
  providers: [
    CreateVeiculoUseCase,
    FindAllVeiculosUseCase,
    FindVeiculoByPlacaUseCase,
    UpdateVeiculoUseCase,
    RemoveVeiculoUseCase,
  ],
})
export class VeiculoModule {}
