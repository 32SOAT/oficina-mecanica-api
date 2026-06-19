import { OrdemServicoReposicaoAdapter } from './ordem-servico-reposicao.adapter';

describe('OrdemServicoReposicaoAdapter', () => {
  it('delegates to use case', async () => {
    const useCase = { execute: jest.fn().mockResolvedValue(undefined) };
    const adapter = new OrdemServicoReposicaoAdapter(useCase as never);

    await adapter.tentarLiberarOsAposReposicao([1, 2], 'user-id');

    expect(useCase.execute).toHaveBeenCalledWith([1, 2], 'user-id');
  });
});
