import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { CreateVeiculoInput } from '../../application/dto/create-veiculo.input';
import { FindAllVeiculosInput } from '../../application/dto/find-all-veiculos.input';
import { UpdateVeiculoInput } from '../../application/dto/update-veiculo.input';
import { CreateVeiculoDto } from '../dto/create-veiculo.dto';
import { UpdateVeiculoDto } from '../dto/update-veiculo.dto';

export class VeiculoPresentationMapper {
  static toCreateInput(dto: CreateVeiculoDto): CreateVeiculoInput {
    return {
      placa: dto.placa,
      marca: dto.marca,
      modelo: dto.modelo,
      ano: dto.ano,
      documentoCliente: dto.documentoCliente,
    };
  }

  static toUpdateInput(dto: UpdateVeiculoDto): UpdateVeiculoInput {
    return {
      marca: dto.marca,
      modelo: dto.modelo,
      ano: dto.ano,
      documentoCliente: dto.documentoCliente,
    };
  }

  static toFindAllInput(dto: PaginationDto): FindAllVeiculosInput {
    return {
      page: dto.page,
      take: dto.take,
    };
  }
}
