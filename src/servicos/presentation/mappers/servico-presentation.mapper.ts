import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { CreateServicoInput } from '../../application/dto/create-servico.input';
import { FindAllServicosInput } from '../../application/dto/find-all-servicos.input';
import { UpdateServicoInput } from '../../application/dto/update-servico.input';
import { CreateServicoDto } from '../dto/create-servico.dto';
import { UpdateServicoDto } from '../dto/update-servico.dto';

export class ServicoPresentationMapper {
  static toCreateInput(dto: CreateServicoDto): CreateServicoInput {
    return {
      servico: dto.servico,
      descricao: dto.descricao,
      precoMaoDeObra: dto.precoMaoDeObra,
    };
  }

  static toUpdateInput(dto: UpdateServicoDto): UpdateServicoInput {
    return {
      servico: dto.servico,
      descricao: dto.descricao,
      precoMaoDeObra: dto.precoMaoDeObra,
    };
  }

  static toFindAllInput(dto: PaginationDto): FindAllServicosInput {
    return {
      page: dto.page,
      take: dto.take,
    };
  }
}
