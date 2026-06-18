import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClienteModule } from './module';
import { ClienteController } from './presentation/controllers/cliente.controller';
import { ClienteTypeormEntity } from './infrastructure/typeorm/entity/cliente.typeorm.entity';

const ormRepositoryMock = {
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  softRemove: jest.fn(),
};

describe('ClienteModule', () => {
  it('should compile and resolve controller and repository', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ClienteModule],
    })
      .overrideProvider(getRepositoryToken(ClienteTypeormEntity))
      .useValue(ormRepositoryMock)
      .compile();

    expect(moduleRef.get(ClienteController)).toBeInstanceOf(ClienteController);
  });
});
