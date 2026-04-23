import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateVeiculoDto } from './create-veiculo.dto';

export class UpdateVeiculoDto extends PartialType(
  OmitType(CreateVeiculoDto, ['placa', 'documentoCliente'] as const),
) {}