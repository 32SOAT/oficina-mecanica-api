import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CLIENTE_REPOSITORY } from '../application/cliente-repository.interface';
import { ClienteInfraModule } from './cliente-infra.module';
import { ClienteTypeormRepository } from './typeorm/cliente.repository';
import { ClienteTypeormEntity } from './typeorm/cliente.typeorm.entity';

const ormRepositoryMock = {
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  softRemove: jest.fn(),
};

describe('ClienteInfraModule', () => {
  it('should resolve repository via DI', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ClienteInfraModule],
    })
      .overrideProvider(getRepositoryToken(ClienteTypeormEntity))
      .useValue(ormRepositoryMock)
      .compile();

    const repo = moduleRef.get<ClienteTypeormRepository>(CLIENTE_REPOSITORY);
    expect(repo).toBeInstanceOf(ClienteTypeormRepository);
  });
});
