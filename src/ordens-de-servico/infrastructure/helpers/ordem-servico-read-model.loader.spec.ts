import type { ClienteLookupPort } from '../../../clientes/application/ports/cliente-lookup.port';
import type { EstoqueLookupPort } from '../../../estoque/application/ports/estoque-lookup.port';
import type { ServicoLookupPort } from '../../../servicos/application/ports/servico-lookup.port';
import type { VeiculoLookupPort } from '../../../veiculos/application/ports/veiculo-lookup.port';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { OrdemServicoTypeormEntity } from '../typeorm/entity/ordem-servico.typeorm.entity';
import { buildOrdemServicoReadModel } from './ordem-servico-read-model.loader';

describe('buildOrdemServicoReadModel', () => {
  const lookups = {
    clienteLookup: { findSnapshotById: jest.fn() },
    veiculoLookup: { findSnapshotById: jest.fn() },
    servicoLookup: { findSnapshotById: jest.fn() },
    estoqueLookup: { findSnapshotById: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enriquece cliente, veículo, serviço e peça soft-deleted via lookup ports', async () => {
    const entity = new OrdemServicoTypeormEntity();
    Object.assign(entity, {
      id: 'os-1',
      veiculo_id: 'vei-1',
      cliente_id: 'cli-1',
      valorTotal: 250,
      status: StatusOrdemServico.Recebida,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: null,
      itensServico: [
        {
          id: 'is-1',
          os_id: 'os-1',
          servico_id: 10,
          precoAplicado: 100,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          deletedAt: null,
        },
      ],
      itensPeca: [
        {
          id: 'ip-1',
          os_id: 'os-1',
          estoque_id: 20,
          quantidade: 1,
          precoAplicado: 50,
          disponivelNoDiagnostico: true,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          deletedAt: null,
        },
      ],
    });

    lookups.clienteLookup.findSnapshotById.mockResolvedValue({
      id: 'cli-1',
      documento: '39053344705',
      nome: 'João',
      email: 'joao@example.com',
      celularNumero: '11999999999',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: new Date('2026-02-01'),
    });
    lookups.veiculoLookup.findSnapshotById.mockResolvedValue({
      id: 'vei-1',
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      cliente_id: 'cli-1',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: new Date('2026-02-01'),
    });
    lookups.servicoLookup.findSnapshotById.mockResolvedValue({
      id: 10,
      servico: 'Alinhamento',
      precoMaoDeObra: 120,
    });
    lookups.estoqueLookup.findSnapshotById.mockResolvedValue({
      id: 20,
      codigo: 'P-20',
      pecasInsumos: 'Filtro de óleo',
      quantidadeFisica: 5,
      quantidadeReservada: 1,
      precoUnitario: 50,
    });

    const readModel = await buildOrdemServicoReadModel(entity, {
      clienteLookup: lookups.clienteLookup as unknown as ClienteLookupPort,
      veiculoLookup: lookups.veiculoLookup as unknown as VeiculoLookupPort,
      servicoLookup: lookups.servicoLookup as unknown as ServicoLookupPort,
      estoqueLookup: lookups.estoqueLookup as unknown as EstoqueLookupPort,
    });

    expect(lookups.clienteLookup.findSnapshotById).toHaveBeenCalledWith(
      'cli-1',
      { includeDeleted: true },
    );
    expect(lookups.veiculoLookup.findSnapshotById).toHaveBeenCalledWith(
      'vei-1',
      { includeDeleted: true },
    );
    expect(lookups.servicoLookup.findSnapshotById).toHaveBeenCalledWith(10, {
      includeDeleted: true,
    });
    expect(lookups.estoqueLookup.findSnapshotById).toHaveBeenCalledWith(20, {
      includeDeleted: true,
    });
    expect(readModel.cliente?.nome).toBe('João');
    expect(readModel.veiculo?.placa).toBe('ABC1D23');
    expect(readModel.itensServico?.[0]?.servico?.servico).toBe('Alinhamento');
    expect(readModel.itensPeca?.[0]?.peca?.pecasInsumos).toBe('Filtro de óleo');
  });

  it('não consulta lookup quando relações já vieram carregadas', async () => {
    const entity = new OrdemServicoTypeormEntity();
    Object.assign(entity, {
      id: 'os-1',
      veiculo_id: 'vei-1',
      cliente_id: 'cli-1',
      valorTotal: 100,
      status: StatusOrdemServico.Recebida,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: null,
      cliente: {
        id: 'cli-1',
        documento: '39053344705',
        nome: 'João',
        email: 'joao@example.com',
        celularNumero: '11999999999',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      },
      veiculo: {
        id: 'vei-1',
        placa: 'ABC1D23',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2020,
        cliente_id: 'cli-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      },
      itensServico: [
        {
          id: 'is-1',
          os_id: 'os-1',
          servico_id: 10,
          precoAplicado: 100,
          servico: { id: 10, servico: 'Alinhamento', precoMaoDeObra: 120 },
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          deletedAt: null,
        },
      ],
      itensPeca: [
        {
          id: 'ip-1',
          os_id: 'os-1',
          estoque_id: 20,
          quantidade: 1,
          precoAplicado: 50,
          disponivelNoDiagnostico: true,
          peca: {
            id: 20,
            codigo: 'P-20',
            pecasInsumos: 'Filtro',
            quantidadeFisica: 5,
            quantidadeReservada: 0,
            precoUnitario: 50,
          },
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          deletedAt: null,
        },
      ],
    });

    const readModel = await buildOrdemServicoReadModel(entity, {
      clienteLookup: lookups.clienteLookup as unknown as ClienteLookupPort,
      veiculoLookup: lookups.veiculoLookup as unknown as VeiculoLookupPort,
      servicoLookup: lookups.servicoLookup as unknown as ServicoLookupPort,
      estoqueLookup: lookups.estoqueLookup as unknown as EstoqueLookupPort,
    });

    expect(lookups.clienteLookup.findSnapshotById).not.toHaveBeenCalled();
    expect(lookups.veiculoLookup.findSnapshotById).not.toHaveBeenCalled();
    expect(lookups.servicoLookup.findSnapshotById).not.toHaveBeenCalled();
    expect(lookups.estoqueLookup.findSnapshotById).not.toHaveBeenCalled();
    expect(readModel.cliente?.nome).toBe('João');
    expect(readModel.itensServico?.[0]?.servico?.servico).toBe('Alinhamento');
  });

  it('ignora snapshot ausente nos lookups sem quebrar o read model', async () => {
    const entity = new OrdemServicoTypeormEntity();
    Object.assign(entity, {
      id: 'os-1',
      veiculo_id: 'vei-1',
      cliente_id: 'cli-1',
      valorTotal: 0,
      status: StatusOrdemServico.Recebida,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: null,
      itensServico: [
        {
          id: 'is-1',
          os_id: 'os-1',
          servico_id: 10,
          precoAplicado: 100,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          deletedAt: null,
        },
      ],
      itensPeca: [
        {
          id: 'ip-1',
          os_id: 'os-1',
          estoque_id: 20,
          quantidade: 1,
          precoAplicado: 50,
          disponivelNoDiagnostico: true,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          deletedAt: null,
        },
      ],
    });

    lookups.clienteLookup.findSnapshotById.mockResolvedValue(null);
    lookups.veiculoLookup.findSnapshotById.mockResolvedValue(null);
    lookups.servicoLookup.findSnapshotById.mockResolvedValue(null);
    lookups.estoqueLookup.findSnapshotById.mockResolvedValue(null);

    const readModel = await buildOrdemServicoReadModel(entity, {
      clienteLookup: lookups.clienteLookup as unknown as ClienteLookupPort,
      veiculoLookup: lookups.veiculoLookup as unknown as VeiculoLookupPort,
      servicoLookup: lookups.servicoLookup as unknown as ServicoLookupPort,
      estoqueLookup: lookups.estoqueLookup as unknown as EstoqueLookupPort,
    });

    expect(readModel.cliente).toBeUndefined();
    expect(readModel.veiculo).toBeUndefined();
    expect(readModel.itensServico?.[0]?.servico).toBeUndefined();
    expect(readModel.itensPeca?.[0]?.peca).toBeUndefined();
  });
});
