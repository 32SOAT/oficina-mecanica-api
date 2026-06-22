import { Repository } from 'typeorm';
import { VeiculoTypeormRepository } from './veiculo.repository';
import { VeiculoTypeormEntity } from '../entity/veiculo.typeorm.entity';
import { Veiculo } from '../../../domain/veiculo';
import { ClienteTypeormEntity } from '../../../../clientes/infrastructure/typeorm/entity/cliente.typeorm.entity';

const makeEntity = () => {
  const entity = new VeiculoTypeormEntity();
  entity.id = 'veiculo-id';
  entity.placa = 'ABC1D23';
  entity.marca = 'Toyota';
  entity.modelo = 'Corolla';
  entity.ano = 2020;
  entity.cliente_id = 'cliente-id';
  entity.createdAt = new Date();
  entity.updatedAt = new Date();
  entity.deletedAt = null;
  return entity;
};

const makeVeiculo = () =>
  Veiculo.create({
    id: 'veiculo-id',
    placa: 'ABC1D23',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    clienteId: 'cliente-id',
  });

describe('VeiculoTypeormRepository', () => {
  let repository: VeiculoTypeormRepository;
  let ormRepository: jest.Mocked<
    Pick<
      Repository<VeiculoTypeormEntity>,
      'save' | 'findAndCount' | 'findOne' | 'softRemove'
    >
  >;

  beforeEach(() => {
    ormRepository = {
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    };
    repository = new VeiculoTypeormRepository(
      ormRepository as unknown as Repository<VeiculoTypeormEntity>,
    );
  });

  it('save usa entidade salva quando reload não encontra cliente', async () => {
    const entity = makeEntity();
    ormRepository.save.mockResolvedValue(entity);
    ormRepository.findOne.mockResolvedValue(null);

    const result = await repository.save(makeVeiculo());

    expect(result.placa.toString()).toBe('ABC1D23');
    expect(result.cliente).toBeUndefined();
  });

  it('finds all veiculos', async () => {
    const entity = makeEntity();
    ormRepository.findAndCount.mockResolvedValue([[entity], 1]);

    const [veiculos, count] = await repository.findAll(0, 10);

    expect(veiculos).toHaveLength(1);
    expect(count).toBe(1);
  });

  it('finds by placa when veículo existe', async () => {
    ormRepository.findOne.mockResolvedValue(makeEntity());

    const result = await repository.findByPlaca('ABC1D23');

    expect(result?.placa.toString()).toBe('ABC1D23');
  });

  it('finds by placa and id retorna null quando não existe', async () => {
    ormRepository.findOne.mockResolvedValue(null);

    await expect(repository.findByPlaca('ABC1D23')).resolves.toBeNull();
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('checks placa existence', async () => {
    ormRepository.findOne.mockResolvedValue(null);
    await expect(repository.existsByPlaca('NOPE')).resolves.toBe(false);

    ormRepository.findOne.mockResolvedValue(makeEntity());
    await expect(repository.existsByPlaca('ABC1D23')).resolves.toBe(true);
  });

  it('soft removes veiculo sem cliente no reload', async () => {
    const entity = makeEntity();
    entity.deletedAt = new Date();
    ormRepository.softRemove.mockResolvedValue(entity);
    ormRepository.findOne.mockResolvedValue(null);

    const result = await repository.softRemove(makeVeiculo().softRemove());

    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  it('soft removes veiculo with cliente relation', async () => {
    const entity = makeEntity();
    const cliente = new ClienteTypeormEntity();
    cliente.id = 'cliente-id';
    cliente.documento = '39053344705';
    cliente.nome = 'Jane';
    cliente.email = 'jane@example.com';
    cliente.celularNumero = '11999999999';
    entity.cliente = cliente;

    ormRepository.softRemove.mockResolvedValue(entity);
    ormRepository.findOne.mockResolvedValue(entity);

    const result = await repository.softRemove(makeVeiculo().softRemove());

    expect(result.cliente?.nome).toBe('Jane');
  });
});
