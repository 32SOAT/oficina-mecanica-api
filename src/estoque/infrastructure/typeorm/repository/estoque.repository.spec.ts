import { Repository } from 'typeorm';
import { EstoqueTypeormRepository } from './estoque.repository';
import { EstoqueTypeormEntity } from '../entity/estoque.typeorm.entity';
import { Estoque } from '../../../domain/estoque';

describe('EstoqueTypeormRepository', () => {
  let repository: EstoqueTypeormRepository;
  let ormRepository: jest.Mocked<
    Pick<
      Repository<EstoqueTypeormEntity>,
      'save' | 'findOneBy' | 'createQueryBuilder' | 'softRemove'
    >
  >;

  beforeEach(() => {
    ormRepository = {
      save: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
      softRemove: jest.fn(),
    };
    repository = new EstoqueTypeormRepository(
      ormRepository as unknown as Repository<EstoqueTypeormEntity>,
    );
  });

  it('saves estoque', async () => {
    const entity = new EstoqueTypeormEntity();
    entity.id = 1;
    entity.codigo = 'PCA-001';
    entity.pecasInsumos = 'Pastilha';
    entity.quantidadeFisica = 10;
    entity.quantidadeReservada = 0;
    entity.precoUnitario = 89.9;
    ormRepository.save.mockResolvedValue(entity);

    const result = await repository.save(
      Estoque.create({
        codigo: 'PCA-001',
        pecasInsumos: 'Pastilha',
        quantidadeFisica: 10,
        precoUnitario: 89.9,
      }),
    );

    expect(result.codigo).toBe('PCA-001');
  });

  it('finds by id', async () => {
    ormRepository.findOneBy.mockResolvedValue(null);
    await expect(repository.findById(99)).resolves.toBeNull();
  });

  it('finds all with optional estoque baixo filter', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<EstoqueTypeormEntity>['createQueryBuilder']
      >,
    );

    await repository.findAll(0, 10, true);
    expect(queryBuilder.andWhere).toHaveBeenCalled();
  });

  it('soft removes estoque', async () => {
    const entity = new EstoqueTypeormEntity();
    entity.id = 1;
    entity.codigo = 'PCA-001';
    entity.pecasInsumos = 'Pastilha';
    entity.quantidadeFisica = 0;
    entity.quantidadeReservada = 0;
    entity.precoUnitario = 89.9;
    ormRepository.softRemove.mockResolvedValue(entity);

    const result = await repository.softRemove(
      new Estoque({
        id: 1,
        codigo: 'PCA-001',
        pecasInsumos: 'Pastilha',
        quantidadeFisica: 0,
        quantidadeReservada: 0,
        precoUnitario: 89.9,
      }),
    );

    expect(result.id).toBe(1);
  });

  it('checks codigo existence only among active items', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 3 }),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<EstoqueTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(repository.existsByCodigo('PCA-003', 7)).resolves.toBe(true);

    expect(queryBuilder.where).toHaveBeenCalledWith('estoque.codigo = :codigo', {
      codigo: 'PCA-003',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'estoque.deleted_at IS NULL',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('estoque.id != :excludeId', {
      excludeId: 7,
    });
  });

  it('returns false when codigo is not in use by active items', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<EstoqueTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(repository.existsByCodigo('PCA-999')).resolves.toBe(false);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'estoque.deleted_at IS NULL',
    );
  });
});
