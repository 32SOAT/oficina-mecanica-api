import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { CreateClienteInput } from '../../application/dto/create-cliente.input';
import { FindAllClientesInput } from '../../application/dto/find-all-clientes.input';
import { UpdateClienteInput } from '../../application/dto/update-cliente.input';
import { CreateClienteDto } from '../dtos/create-cliente.dto';
import { UpdateClienteDto } from '../dtos/update-cliente.dto';

export class ClientePresentationMapper {
  static toCreateInput(dto: CreateClienteDto): CreateClienteInput {
    return {
      documento: dto.documento,
      nome: dto.nome,
      email: dto.email,
      celularNumero: dto.celularNumero,
    };
  }

  static toUpdateInput(dto: UpdateClienteDto): UpdateClienteInput {
    return {
      documento: dto.documento,
      nome: dto.nome,
      email: dto.email,
      celularNumero: dto.celular,
    };
  }

  static toFindAllInput(dto: PaginationDto): FindAllClientesInput {
    return {
      page: dto.page,
      take: dto.take,
    };
  }
}
