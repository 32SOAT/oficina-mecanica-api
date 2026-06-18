import { IsNull, Repository } from 'typeorm';
import { ClienteTypeormRepository } from './cliente.repository';
import { ClienteTypeormEntity } from '../entity/cliente.typeorm.entity';
import { Cliente } from '../../../domain/cliente';
import { ClienteDocumento } from '../../../domain/cliente-documento';

const makeCliente = (id = 'cliente-id') =>
  Cliente.create({
    id,
    documento: ClienteDocumento.create('39053344705'),
    nome: 'Jane Doe',
    email: 'jane@example.com',
    celularNumero: '11999999999',
  });

const makeEntity = (id = 'cliente-id') => {
  const entity = new ClienteTypeormEntity();
  entity.id = id;
  entity.documento = '39053344705';
  entity.nome = 'Jane Doe';
  entity.email = 'jane@example.com';
  entity.celularNumero = '11999999999';
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  entity.deletedAt = null;
  return entity;
};

describe('ClienteTypeormRepository', () => {
  let repository: ClienteTypeormRepository;
  let ormRepository: jest.Mocked<
    Pick<
      Repository<ClienteTypeormEntity>,
      | 'save'
      | 'findAndCount'
      | 'findOne'
      | 'findOneBy'
      | 'createQueryBuilder'
      | 'softRemove'
    >
  >;

  beforeEach(() => {
    ormRepository = {
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
      softRemove: jest.fn(),
    };
    repository = new ClienteTypeormRepository(
      ormRepository as unknown as Repository<ClienteTypeormEntity>,
    );
  });

  it('saves and maps domain entity', async () => {
    const cliente = makeCliente();
    const entity = makeEntity();
    ormRepository.save.mockResolvedValue(entity);

    const result = await repository.save(cliente);

    expect(ormRepository.save).toHaveBeenCalled();
    expect(result.id).toBe(entity.id);
    expect(result.documento.toString()).toBe(entity.documento);
  });

  it('finds all active clients with pagination', async () => {
    const entity = makeEntity();
    ormRepository.findAndCount.mockResolvedValue([[entity], 1]);

    const [clientes, count] = await repository.findAll(0, 10);

    expect(ormRepository.findAndCount).toHaveBeenCalledWith({
      where: { deletedAt: IsNull() },
      skip: 0,
      take: 10,
    });
    expect(clientes).toHaveLength(1);
    expect(count).toBe(1);
  });

  it('finds client by documento', async () => {
    const entity = makeEntity();
    ormRepository.findOne.mockResolvedValue(entity);

    const result = await repository.findByDocumento('39053344705');

    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { documento: '39053344705' },
    });
    expect(result?.id).toBe(entity.id);
  });

  it('returns null when documento is not found', async () => {
    ormRepository.findOne.mockResolvedValue(null);

    await expect(repository.findByDocumento('39053344705')).resolves.toBeNull();
  });

  it('finds client by id', async () => {
    const entity = makeEntity();
    ormRepository.findOneBy.mockResolvedValue(entity);

    const result = await repository.findById('cliente-id');

    expect(ormRepository.findOneBy).toHaveBeenCalledWith({ id: 'cliente-id' });
    expect(result?.id).toBe('cliente-id');
  });

  it('returns null when id is not found', async () => {
    ormRepository.findOneBy.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('checks documento existence without excludeId', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(makeEntity()),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<ClienteTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(repository.existsByDocumento('39053344705')).resolves.toBe(
      true,
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
  });

  it('checks documento existence excluding current id', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<ClienteTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(
      repository.existsByDocumento('39053344705', 'cliente-id'),
    ).resolves.toBe(false);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'cliente.id != :excludeId',
      { excludeId: 'cliente-id' },
    );
  });

  it('soft removes client', async () => {
    const cliente = makeCliente();
    const removedEntity = makeEntity();
    removedEntity.deletedAt = new Date();
    ormRepository.softRemove.mockResolvedValue(removedEntity);

    const result = await repository.softRemove(cliente);

    expect(ormRepository.softRemove).toHaveBeenCalled();
    expect(result.deletedAt).toBeInstanceOf(Date);
  });
});
