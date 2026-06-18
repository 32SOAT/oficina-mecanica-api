import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClienteTypeormRepository } from './typeorm/repository/cliente.repository';
import { ClienteTypeormEntity } from './typeorm/entity/cliente.typeorm.entity';

const ormRepositoryMock = {
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  softRemove: jest.fn(),
};

describe('ClienteTypeormRepository', () => {
  let repo: ClienteTypeormRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClienteTypeormRepository,
        {
          provide: getRepositoryToken(ClienteTypeormEntity),
          useValue: ormRepositoryMock,
        },
      ],
    }).compile();

    repo = moduleRef.get(ClienteTypeormRepository);
  });

  it('should be defined', () => {
    expect(repo).toBeDefined();
  });
});
