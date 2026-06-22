import {
  ConflictError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { EntityManager } from 'typeorm';
import { VeiculoTransactionalAdapter } from './veiculo-transactional.adapter';

describe('VeiculoTransactionalAdapter', () => {
  const adapter = new VeiculoTransactionalAdapter();

  it('retorna id do veículo quando pertence ao cliente', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue({ id: 'vei-1', cliente_id: 'cli-1' }),
    } as unknown as EntityManager;

    await expect(
      adapter.findIdForCliente(em, 'ABC1D23', 'cli-1'),
    ).resolves.toBe('vei-1');
  });

  it('lança NotFoundError quando veículo não existe', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as EntityManager;

    await expect(
      adapter.findIdForCliente(em, 'ABC1D23', 'cli-1'),
    ).rejects.toThrow(NotFoundError);
  });

  it('lança ConflictError quando veículo pertence a outro cliente', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue({ id: 'vei-1', cliente_id: 'outro' }),
    } as unknown as EntityManager;

    await expect(
      adapter.findIdForCliente(em, 'ABC1D23', 'cli-1'),
    ).rejects.toThrow(ConflictError);
  });
});
