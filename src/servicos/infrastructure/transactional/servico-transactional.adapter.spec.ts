import { NotFoundError } from '../../../common/application/errors/application.errors';
import { EntityManager } from 'typeorm';
import { ServicoTransactionalAdapter } from './servico-transactional.adapter';

describe('ServicoTransactionalAdapter', () => {
  const adapter = new ServicoTransactionalAdapter();

  it('retorna snapshot de preço do serviço', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue({ id: 7, precoMaoDeObra: '120.50' }),
    } as unknown as EntityManager;

    await expect(adapter.findPreco(em, 7)).resolves.toEqual({
      servicoId: 7,
      precoAplicado: 120.5,
    });
  });

  it('lança NotFoundError quando serviço não existe', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as EntityManager;

    await expect(adapter.findPreco(em, 99)).rejects.toThrow(NotFoundError);
  });
});
