import { Repository } from 'typeorm';
import { EstoqueTypeormRepository } from './estoque.repository';
import { EstoqueTypeormEntity } from '../entity/estoque.typeorm.entity';

describe('EstoqueTypeormRepository', () => {
  let repository: EstoqueTypeormRepository;
  let ormRepository: jest.Mocked<
    Pick<Repository<EstoqueTypeormEntity>, 'createQueryBuilder'>
  >;

  beforeEach(() => {
    ormRepository = {
      createQueryBuilder: jest.fn(),
    };
    repository = new EstoqueTypeormRepository(
      ormRepository as unknown as Repository<EstoqueTypeormEntity>,
    );
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
