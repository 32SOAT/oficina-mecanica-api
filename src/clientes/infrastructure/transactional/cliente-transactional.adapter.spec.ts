import { NotFoundError } from '../../../common/application/errors/application.errors';
import { EntityManager } from 'typeorm';
import { ClienteTypeormEntity } from '../typeorm/entity/cliente.typeorm.entity';
import { ClienteTransactionalAdapter } from './cliente-transactional.adapter';

describe('ClienteTransactionalAdapter', () => {
  const adapter = new ClienteTransactionalAdapter();

  it('retorna id do cliente', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue({ id: 'cli-1' }),
    } as unknown as EntityManager;

    await expect(
      adapter.findIdByDocumento(em, '12345678900'),
    ).resolves.toBe('cli-1');
  });

  it('lanca 404 quando cliente nao existe', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as EntityManager;

    await expect(
      adapter.findIdByDocumento(em, '12345678900'),
    ).rejects.toThrow(NotFoundError);
  });
});
