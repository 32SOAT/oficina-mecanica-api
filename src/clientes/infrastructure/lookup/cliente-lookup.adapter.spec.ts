import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { Cliente } from '../../domain/cliente';
import { ClienteLookupAdapter } from './cliente-lookup.adapter';

describe('ClienteLookupAdapter', () => {
  const clienteRepository = {
    findByDocumento: jest.fn(),
  };
  let adapter: ClienteLookupAdapter;

  beforeEach(() => {
    adapter = new ClienteLookupAdapter(clienteRepository as never);
    jest.clearAllMocks();
  });

  it('resolves cliente id by documento', async () => {
    clienteRepository.findByDocumento.mockResolvedValue(
      Cliente.create({
        id: 'cliente-id',
        nome: 'João',
        email: 'joao@example.com',
        documento: '39053344705',
        celularNumero: '11999999999',
      }),
    );

    await expect(
      adapter.resolveClienteIdByDocumento('39053344705'),
    ).resolves.toBe('cliente-id');
    expect(clienteRepository.findByDocumento).toHaveBeenCalledWith(
      '39053344705',
    );
  });

  it('throws when cliente is not found', async () => {
    clienteRepository.findByDocumento.mockResolvedValue(null);

    await expect(
      adapter.resolveClienteIdByDocumento('39053344705'),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws BadRequestError when documento is invalid', async () => {
    await expect(
      adapter.resolveClienteIdByDocumento('123'),
    ).rejects.toThrow(BadRequestError);
    expect(clienteRepository.findByDocumento).not.toHaveBeenCalled();
  });
});
