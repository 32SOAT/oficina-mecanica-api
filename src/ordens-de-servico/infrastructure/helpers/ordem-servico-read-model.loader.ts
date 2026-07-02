import type { ClienteLookupPort } from '../../../clientes/application/ports/cliente-lookup.port';
import type { EstoqueLookupPort } from '../../../estoque/application/ports/estoque-lookup.port';
import type { ServicoLookupPort } from '../../../servicos/application/ports/servico-lookup.port';
import type { VeiculoLookupPort } from '../../../veiculos/application/ports/veiculo-lookup.port';
import type { OrdemServicoReadModel } from '../../application/read-models/ordem-servico-read-model';
import { OrdemServicoReadModelMapper } from '../mappers/ordem-servico-read-model.mapper';
import { OrdemServicoTypeormEntity } from '../typeorm/entity/ordem-servico.typeorm.entity';

export type OrdemServicoReadModelLookupPorts = {
  clienteLookup: ClienteLookupPort;
  veiculoLookup: VeiculoLookupPort;
  servicoLookup: ServicoLookupPort;
  estoqueLookup: EstoqueLookupPort;
};

const READ_INCLUDE_DELETED = { includeDeleted: true } as const;

export async function buildOrdemServicoReadModel(
  entity: OrdemServicoTypeormEntity,
  lookups: OrdemServicoReadModelLookupPorts,
): Promise<OrdemServicoReadModel> {
  const readModel = OrdemServicoReadModelMapper.toReadModel(entity);

  if (!readModel.cliente && entity.cliente_id) {
    const clienteSnapshot = await lookups.clienteLookup.findSnapshotById(
      entity.cliente_id,
      READ_INCLUDE_DELETED,
    );
    if (clienteSnapshot) {
      readModel.cliente =
        OrdemServicoReadModelMapper.fromClienteSnapshot(clienteSnapshot);
    }
  }

  if (!readModel.veiculo && entity.veiculo_id) {
    const veiculoSnapshot = await lookups.veiculoLookup.findSnapshotById(
      entity.veiculo_id,
      READ_INCLUDE_DELETED,
    );
    if (veiculoSnapshot) {
      readModel.veiculo =
        OrdemServicoReadModelMapper.fromVeiculoSnapshot(veiculoSnapshot);
    }
  }

  if (readModel.itensServico?.length) {
    await Promise.all(
      readModel.itensServico.map(async (item) => {
        if (item.servico || !item.servico_id) {
          return;
        }
        const servicoSnapshot = await lookups.servicoLookup.findSnapshotById(
          item.servico_id,
          READ_INCLUDE_DELETED,
        );
        if (servicoSnapshot) {
          item.servico =
            OrdemServicoReadModelMapper.fromServicoSnapshot(servicoSnapshot);
        }
      }),
    );
  }

  if (readModel.itensPeca?.length) {
    await Promise.all(
      readModel.itensPeca.map(async (item) => {
        if (item.peca || !item.estoque_id) {
          return;
        }
        const estoqueSnapshot = await lookups.estoqueLookup.findSnapshotById(
          item.estoque_id,
          READ_INCLUDE_DELETED,
        );
        if (estoqueSnapshot) {
          item.peca =
            OrdemServicoReadModelMapper.fromEstoqueSnapshot(estoqueSnapshot);
        }
      }),
    );
  }

  return readModel;
}
