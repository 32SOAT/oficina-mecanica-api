import { ClienteTypeormEntity } from '../../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import { EstoqueTypeormEntity } from '../../../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import { ServicoTypeormEntity } from '../../../servicos/infrastructure/typeorm/entity/servico.typeorm.entity';
import { VeiculoTypeormEntity } from '../../../veiculos/infrastructure/typeorm/entity/veiculo.typeorm.entity';
import type {
  ClienteOsReadModel,
  EstoqueSnapshotReadModel,
  HistoricoStatusReadModel,
  ItemPecaOsReadModel,
  ItemServicoOsReadModel,
  OrdemServicoReadModel,
  ServicoSnapshotReadModel,
  VeiculoOsReadModel,
} from '../../application/read-models/ordem-servico-read-model';
import { HistoricoStatusOsEntity } from '../typeorm/entity/historico-status-os.entity';
import { ItemOsEstoqueEntity } from '../typeorm/entity/item-os-estoque.entity';
import { ItemOsServicoEntity } from '../typeorm/entity/item-os-servico.entity';
import { OrdemServicoTypeormEntity } from '../typeorm/entity/ordem-servico.typeorm.entity';

export class OrdemServicoReadModelMapper {
  static toReadModel(entity: OrdemServicoTypeormEntity): OrdemServicoReadModel {
    return {
      id: entity.id,
      veiculo_id: entity.veiculo_id,
      cliente_id: entity.cliente_id,
      valorTotal: Number(entity.valorTotal),
      observacao: entity.observacao,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
      cliente: entity.cliente
        ? this.toCliente(entity.cliente)
        : undefined,
      veiculo: entity.veiculo
        ? this.toVeiculo(entity.veiculo)
        : undefined,
      itensServico: entity.itensServico?.map((item) =>
        this.toItemServico(item),
      ),
      itensPeca: entity.itensPeca?.map((item) => this.toItemPeca(item)),
    };
  }

  static toHistoricoReadModel(
    entity: HistoricoStatusOsEntity,
  ): HistoricoStatusReadModel {
    return {
      id: entity.id,
      os_id: entity.os_id,
      statusAnterior: entity.statusAnterior,
      statusNovo: entity.statusNovo,
      usuarioId: entity.usuarioId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  private static toCliente(entity: ClienteTypeormEntity): ClienteOsReadModel {
    return {
      id: entity.id,
      documento: entity.documento,
      nome: entity.nome,
      email: entity.email,
      celularNumero: entity.celularNumero,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  private static toVeiculo(entity: VeiculoTypeormEntity): VeiculoOsReadModel {
    return {
      id: entity.id,
      placa: entity.placa,
      marca: entity.marca,
      modelo: entity.modelo,
      ano: entity.ano,
      cliente_id: entity.cliente_id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  private static toServicoSnapshot(
    entity: ServicoTypeormEntity,
  ): ServicoSnapshotReadModel {
    return {
      id: entity.id,
      servico: entity.servico,
      descricao: entity.descricao,
      precoMaoDeObra: Number(entity.precoMaoDeObra),
    };
  }

  private static toEstoqueSnapshot(
    entity: EstoqueTypeormEntity,
  ): EstoqueSnapshotReadModel {
    return {
      id: entity.id,
      codigo: entity.codigo,
      pecasInsumos: entity.pecasInsumos,
      quantidadeFisica: entity.quantidadeFisica,
      quantidadeReservada: entity.quantidadeReservada,
      precoUnitario: Number(entity.precoUnitario),
    };
  }

  private static toItemServico(
    entity: ItemOsServicoEntity,
  ): ItemServicoOsReadModel {
    return {
      id: entity.id,
      os_id: entity.os_id,
      servico_id: entity.servico_id,
      precoAplicado: Number(entity.precoAplicado),
      servico: entity.servico
        ? this.toServicoSnapshot(entity.servico)
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  private static toItemPeca(entity: ItemOsEstoqueEntity): ItemPecaOsReadModel {
    return {
      id: entity.id,
      os_id: entity.os_id,
      estoque_id: entity.estoque_id,
      quantidade: entity.quantidade,
      precoAplicado: Number(entity.precoAplicado),
      disponivelNoDiagnostico: entity.disponivelNoDiagnostico,
      peca: entity.peca ? this.toEstoqueSnapshot(entity.peca) : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
