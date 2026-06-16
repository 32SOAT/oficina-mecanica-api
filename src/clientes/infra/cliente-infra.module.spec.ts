import { Test } from '@nestjs/testing';
import { CLIENTE_REPOSITORY } from '../application/cliente-repository.interface';
import { ClienteTypeormRepository } from './typeorm/cliente.repository';

describe('ClienteInfraModule', () => {
  it('should resolve repository via DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClienteTypeormRepository,
        {
          provide: CLIENTE_REPOSITORY,
          useClass: ClienteTypeormRepository,
        },
      ],
    }).compile();

    const repo = moduleRef.get<ClienteTypeormRepository>(CLIENTE_REPOSITORY);
    expect(repo).toBeInstanceOf(ClienteTypeormRepository);
  });
});
