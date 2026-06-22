import { ApiProperty } from '@nestjs/swagger';
import type {
  ClienteOsReadModel,
  EstoqueSnapshotReadModel,
  ItemPecaOsReadModel,
  ItemServicoOsReadModel,
  OrdemServicoReadModel,
  ServicoSnapshotReadModel,
  VeiculoOsReadModel,
} from '../../application/read-models/ordem-servico-read-model';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

export class ClienteOsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documento: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  celularNumero: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  static fromReadModel(model: ClienteOsReadModel): ClienteOsResponseDto {
    return Object.assign(new ClienteOsResponseDto(), model);
  }
}

export class VeiculoOsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  placa: string;

  @ApiProperty()
  marca: string;

  @ApiProperty()
  modelo: string;

  @ApiProperty()
  ano: number;

  @ApiProperty()
  cliente_id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  static fromReadModel(model: VeiculoOsReadModel): VeiculoOsResponseDto {
    return Object.assign(new VeiculoOsResponseDto(), model);
  }
}

export class ServicoSnapshotResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  servico: string;

  @ApiProperty({ required: false })
  descricao?: string;

  @ApiProperty()
  precoMaoDeObra: number;

  static fromReadModel(
    model: ServicoSnapshotReadModel,
  ): ServicoSnapshotResponseDto {
    return Object.assign(new ServicoSnapshotResponseDto(), model);
  }
}

export class EstoqueSnapshotResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  pecasInsumos: string;

  @ApiProperty()
  quantidadeFisica: number;

  @ApiProperty()
  quantidadeReservada: number;

  @ApiProperty()
  precoUnitario: number;

  static fromReadModel(
    model: EstoqueSnapshotReadModel,
  ): EstoqueSnapshotResponseDto {
    return Object.assign(new EstoqueSnapshotResponseDto(), model);
  }
}

export class ItemServicoOsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  os_id: string;

  @ApiProperty()
  servico_id: number;

  @ApiProperty()
  precoAplicado: number;

  @ApiProperty({ type: () => ServicoSnapshotResponseDto, required: false })
  servico?: ServicoSnapshotResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  static fromReadModel(
    model: ItemServicoOsReadModel,
  ): ItemServicoOsResponseDto {
    return Object.assign(new ItemServicoOsResponseDto(), {
      ...model,
      servico: model.servico
        ? ServicoSnapshotResponseDto.fromReadModel(model.servico)
        : undefined,
    });
  }
}

export class ItemPecaOsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  os_id: string;

  @ApiProperty()
  estoque_id: number;

  @ApiProperty()
  quantidade: number;

  @ApiProperty()
  precoAplicado: number;

  @ApiProperty()
  disponivelNoDiagnostico: boolean;

  @ApiProperty({ type: () => EstoqueSnapshotResponseDto, required: false })
  peca?: EstoqueSnapshotResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  static fromReadModel(model: ItemPecaOsReadModel): ItemPecaOsResponseDto {
    return Object.assign(new ItemPecaOsResponseDto(), {
      ...model,
      peca: model.peca
        ? EstoqueSnapshotResponseDto.fromReadModel(model.peca)
        : undefined,
    });
  }
}

export class OrdemServicoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  veiculo_id: string;

  @ApiProperty()
  cliente_id: string;

  @ApiProperty()
  valorTotal: number;

  @ApiProperty({ nullable: true })
  observacao: string | null;

  @ApiProperty({ enum: StatusOrdemServico })
  status: StatusOrdemServico;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ type: () => ClienteOsResponseDto, required: false })
  cliente?: ClienteOsResponseDto;

  @ApiProperty({ type: () => VeiculoOsResponseDto, required: false })
  veiculo?: VeiculoOsResponseDto;

  @ApiProperty({ type: () => [ItemServicoOsResponseDto], required: false })
  itensServico?: ItemServicoOsResponseDto[];

  @ApiProperty({ type: () => [ItemPecaOsResponseDto], required: false })
  itensPeca?: ItemPecaOsResponseDto[];

  static fromReadModel(readModel: OrdemServicoReadModel): OrdemServicoResponseDto {
    return Object.assign(new OrdemServicoResponseDto(), {
      id: readModel.id,
      veiculo_id: readModel.veiculo_id,
      cliente_id: readModel.cliente_id,
      valorTotal: readModel.valorTotal,
      observacao: readModel.observacao,
      status: readModel.status,
      createdAt: readModel.createdAt,
      updatedAt: readModel.updatedAt,
      deletedAt: readModel.deletedAt,
      cliente: readModel.cliente
        ? ClienteOsResponseDto.fromReadModel(readModel.cliente)
        : undefined,
      veiculo: readModel.veiculo
        ? VeiculoOsResponseDto.fromReadModel(readModel.veiculo)
        : undefined,
      itensServico: readModel.itensServico?.map((item) =>
        ItemServicoOsResponseDto.fromReadModel(item),
      ),
      itensPeca: readModel.itensPeca?.map((item) =>
        ItemPecaOsResponseDto.fromReadModel(item),
      ),
    });
  }
}
