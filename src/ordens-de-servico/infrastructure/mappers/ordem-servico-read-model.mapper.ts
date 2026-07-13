import type { ClienteSnapshot } from '../../../clientes/application/ports/cliente-lookup.port';
import { ClienteTypeormEntity } from '../../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import type { EstoqueSnapshot } from '../../../estoque/application/ports/estoque-lookup.port';
import { EstoqueTypeormEntity } from '../../../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import type { ServicoSnapshot } from '../../../servicos/application/ports/servico-lookup.port';
import { ServicoTypeormEntity } from '../../../servicos/infrastructure/typeorm/entity/servico.typeorm.entity';
import type { VeiculoSnapshot } from '../../../veiculos/application/ports/veiculo-lookup.port';import { VeiculoTypeormEntity } from '../../../veiculos/infrastructure/typeorm/entity/veiculo.typeorm.entity';
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

  static fromClienteSnapshot(snapshot: ClienteSnapshot): ClienteOsReadModel {
    return {
      id: snapshot.id,
      documento: snapshot.documento,
      nome: snapshot.nome,
      email: snapshot.email,
      celularNumero: snapshot.celularNumero,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
      deletedAt: snapshot.deletedAt,
    };
  }

  private static toCliente(entity: ClienteTypeormEntity): ClienteOsReadModel {
    return this.fromClienteSnapshot(entity);
  }
  static fromVeiculoSnapshot(snapshot: VeiculoSnapshot): VeiculoOsReadModel {
    return {
      id: snapshot.id,
      placa: snapshot.placa,
      marca: snapshot.marca,
      modelo: snapshot.modelo,
      ano: snapshot.ano,
      cliente_id: snapshot.cliente_id,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
      deletedAt: snapshot.deletedAt,
    };
  }

  private static toVeiculo(entity: VeiculoTypeormEntity): VeiculoOsReadModel {
    return this.fromVeiculoSnapshot(entity);
  }

  static fromServicoSnapshot(
    snapshot: ServicoSnapshot,
  ): ServicoSnapshotReadModel {
    return {
      id: snapshot.id,
      servico: snapshot.servico,
      descricao: snapshot.descricao,
      precoMaoDeObra: snapshot.precoMaoDeObra,
    };
  }

  static fromEstoqueSnapshot(
    snapshot: EstoqueSnapshot,
  ): EstoqueSnapshotReadModel {
    return {
      id: snapshot.id,
      codigo: snapshot.codigo,
      pecasInsumos: snapshot.pecasInsumos,
      quantidadeFisica: snapshot.quantidadeFisica,
      quantidadeReservada: snapshot.quantidadeReservada,
      precoUnitario: snapshot.precoUnitario,
    };
  }

  private static toServicoSnapshot(
    entity: ServicoTypeormEntity,
  ): ServicoSnapshotReadModel {
    return this.fromServicoSnapshot(entity);
  }

  private static toEstoqueSnapshot(
    entity: EstoqueTypeormEntity,
  ): EstoqueSnapshotReadModel {
    return this.fromEstoqueSnapshot(entity);
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
