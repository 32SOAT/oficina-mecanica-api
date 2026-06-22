import { ClienteTypeormEntity } from '../../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';
import { EstoqueTypeormEntity } from '../../../estoque/infrastructure/typeorm/entity/estoque.typeorm.entity';
import { ServicoTypeormEntity } from '../../../servicos/infrastructure/typeorm/entity/servico.typeorm.entity';
import { VeiculoTypeormEntity } from '../../../veiculos/infrastructure/typeorm/entity/veiculo.typeorm.entity';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';
import { HistoricoStatusOsEntity } from '../typeorm/entity/historico-status-os.entity';
import { ItemOsEstoqueEntity } from '../typeorm/entity/item-os-estoque.entity';
import { ItemOsServicoEntity } from '../typeorm/entity/item-os-servico.entity';
import { OrdemServicoTypeormEntity } from '../typeorm/entity/ordem-servico.typeorm.entity';
import { OrdemServicoReadModelMapper } from './ordem-servico-read-model.mapper';

describe('OrdemServicoReadModelMapper', () => {
  it('maps OS core fields and nested relations', () => {
    const cliente = new ClienteTypeormEntity();
    cliente.id = 'cli-1';
    cliente.documento = '39053344705';
    cliente.nome = 'Jane';
    cliente.email = 'jane@example.com';
    cliente.celularNumero = '11999999999';
    cliente.createdAt = new Date('2024-01-01');
    cliente.updatedAt = new Date('2024-01-01');
    cliente.deletedAt = null;

    const veiculo = new VeiculoTypeormEntity();
    veiculo.id = 'vei-1';
    veiculo.placa = 'ABC1D23';
    veiculo.marca = 'Toyota';
    veiculo.modelo = 'Corolla';
    veiculo.ano = 2020;
    veiculo.cliente_id = 'cli-1';
    veiculo.createdAt = new Date('2024-01-01');
    veiculo.updatedAt = new Date('2024-01-01');
    veiculo.deletedAt = null;

    const servico = new ServicoTypeormEntity();
    servico.id = 1;
    servico.servico = 'Troca de óleo';
    servico.precoMaoDeObra = 150;

    const itemServico = new ItemOsServicoEntity();
    itemServico.id = 'is-1';
    itemServico.os_id = 'os-1';
    itemServico.servico_id = 1;
    itemServico.precoAplicado = 150;
    itemServico.servico = servico;
    itemServico.createdAt = new Date('2024-01-01');
    itemServico.updatedAt = new Date('2024-01-01');
    itemServico.deletedAt = null;

    const peca = new EstoqueTypeormEntity();
    peca.id = 5;
    peca.codigo = 'PCA-001';
    peca.pecasInsumos = 'Pastilha';
    peca.quantidadeFisica = 10;
    peca.quantidadeReservada = 1;
    peca.precoUnitario = 89.9;

    const itemPeca = new ItemOsEstoqueEntity();
    itemPeca.id = 'ip-1';
    itemPeca.os_id = 'os-1';
    itemPeca.estoque_id = 5;
    itemPeca.quantidade = 2;
    itemPeca.precoAplicado = 89.9;
    itemPeca.disponivelNoDiagnostico = true;
    itemPeca.peca = peca;
    itemPeca.createdAt = new Date('2024-01-01');
    itemPeca.updatedAt = new Date('2024-01-01');
    itemPeca.deletedAt = null;

    const os = new OrdemServicoTypeormEntity();
    os.id = 'os-1';
    os.cliente_id = 'cli-1';
    os.veiculo_id = 'vei-1';
    os.valorTotal = 329.8;
    os.observacao = 'Teste';
    os.status = StatusOrdemServico.Recebida;
    os.cliente = cliente;
    os.veiculo = veiculo;
    os.itensServico = [itemServico];
    os.itensPeca = [itemPeca];
    os.createdAt = new Date('2024-01-01');
    os.updatedAt = new Date('2024-01-01');
    os.deletedAt = null;

    const readModel = OrdemServicoReadModelMapper.toReadModel(os);

    expect(readModel.valorTotal).toBe(329.8);
    expect(readModel.cliente?.nome).toBe('Jane');
    expect(readModel.veiculo?.placa).toBe('ABC1D23');
    expect(readModel.itensServico?.[0].servico?.servico).toBe('Troca de óleo');
    expect(readModel.itensPeca?.[0].peca?.codigo).toBe('PCA-001');
  });

  it('maps historico de status', () => {
    const historico = new HistoricoStatusOsEntity();
    historico.id = 'h-1';
    historico.os_id = 'os-1';
    historico.statusAnterior = StatusOrdemServico.Recebida;
    historico.statusNovo = StatusOrdemServico.EmDiagnostico;
    historico.usuarioId = 'user-1';
    historico.createdAt = new Date('2024-01-02');
    historico.updatedAt = new Date('2024-01-02');
    historico.deletedAt = null;

    const readModel =
      OrdemServicoReadModelMapper.toHistoricoReadModel(historico);

    expect(readModel.statusNovo).toBe(StatusOrdemServico.EmDiagnostico);
    expect(readModel.usuarioId).toBe('user-1');
  });
});
