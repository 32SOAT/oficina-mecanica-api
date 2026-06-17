import { Repository } from 'typeorm';
import { ServicoTypeormRepository } from './servico.repository';
import { ServicoTypeormEntity } from '../entity/servico.typeorm.entity';
import { Servico } from '../../../domain/servico';

describe('ServicoTypeormRepository', () => {
  let repository: ServicoTypeormRepository;
  let ormRepository: jest.Mocked<
    Pick<
      Repository<ServicoTypeormEntity>,
      'save' | 'findAndCount' | 'findOneBy' | 'createQueryBuilder' | 'softRemove'
    >
  >;

  beforeEach(() => {
    ormRepository = {
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
      softRemove: jest.fn(),
    };
    repository = new ServicoTypeormRepository(
      ormRepository as unknown as Repository<ServicoTypeormEntity>,
    );
  });

  it('saves servico', async () => {
    const entity = new ServicoTypeormEntity();
    entity.id = 1;
    entity.servico = 'Troca de óleo';
    entity.precoMaoDeObra = 150;
    ormRepository.save.mockResolvedValue(entity);

    const result = await repository.save(
      Servico.create({ nome: 'Troca de óleo', precoMaoDeObra: 150 }),
    );
    expect(result.id).toBe(1);
  });

  it('finds all servicos', async () => {
    const entity = new ServicoTypeormEntity();
    entity.id = 1;
    entity.servico = 'Troca de óleo';
    entity.precoMaoDeObra = 150;
    ormRepository.findAndCount.mockResolvedValue([[entity], 1]);

    const [servicos, count] = await repository.findAll(0, 10);
    expect(servicos).toHaveLength(1);
    expect(count).toBe(1);
  });

  it('returns false when nome is not in use', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<ServicoTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(repository.existsByNome('Inexistente')).resolves.toBe(false);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'servico.deletedAt IS NULL',
    );
  });

  it('checks nome existence excluding current id', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<ServicoTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(repository.existsByNome('Troca', 1)).resolves.toBe(false);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'servico.id != :excludeId',
      { excludeId: 1 },
    );
  });

  it('checks nome existence', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 2 }),
    };
    ormRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as ReturnType<
        Repository<ServicoTypeormEntity>['createQueryBuilder']
      >,
    );

    await expect(repository.existsByNome('Troca', 1)).resolves.toBe(true);
  });

  it('soft removes servico', async () => {
    const entity = new ServicoTypeormEntity();
    entity.id = 1;
    entity.servico = 'Troca de óleo';
    entity.precoMaoDeObra = 150;
    ormRepository.softRemove.mockResolvedValue(entity);

    const result = await repository.softRemove(
      Servico.create({
        id: 1,
        nome: 'Troca de óleo',
        precoMaoDeObra: 150,
      }),
    );
    expect(result.servico).toBe('Troca de óleo');
  });
});
