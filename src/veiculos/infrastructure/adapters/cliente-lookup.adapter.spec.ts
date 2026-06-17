import { ClienteLookupAdapter } from './cliente-lookup.adapter';

describe('ClienteLookupAdapter', () => {
  it('resolves cliente id by documento', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue({ id: 'cliente-id' }),
    };
    const adapter = new ClienteLookupAdapter(useCase as never);

    await expect(
      adapter.resolveClienteIdByDocumento('39053344705'),
    ).resolves.toBe('cliente-id');
  });
});
