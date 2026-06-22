import {
  CriarOrdemServicoInput,
  EditarItensOsInput,
  FiltrosOrdemServicoInput,
} from '../../application/dto/ordem-servico.dto';
import { CriarOrdemServicoDto } from '../dto/criar-ordem-servico.dto';
import { EditarItensOsDto } from '../dto/editar-itens-os.dto';
import { FiltrosOrdemServicoDto } from '../dto/filtros-ordem-servico.dto';

export class OrdemServicoPresentationMapper {
  static toCreateInput(dto: CriarOrdemServicoDto): CriarOrdemServicoInput {
    return {
      documentoCliente: dto.documentoCliente,
      placa: dto.placa,
      observacao: dto.observacao,
      itensServico: dto.itensServico,
      itensPeca: dto.itensPeca,
    };
  }

  static toEditarItensInput(dto: EditarItensOsDto): EditarItensOsInput {
    return {
      itensServico: dto.itensServico,
      itensPeca: dto.itensPeca,
    };
  }

  static toFiltrosInput(dto: FiltrosOrdemServicoDto): FiltrosOrdemServicoInput {
    return {
      page: dto.page,
      take: dto.take,
      status: dto.status,
      clienteId: dto.clienteId,
      dataInicio: dto.dataInicio,
      dataFim: dto.dataFim,
    };
  }
}
