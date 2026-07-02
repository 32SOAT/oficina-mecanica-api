import {
  BadRequestError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { ClienteDocumento } from '../../domain/cliente-documento';
import { Cliente } from '../../domain/cliente';
import { ClienteLookupAdapter } from './cliente-lookup.adapter';

describe('ClienteLookupAdapter', () => {
  const clienteRepository = {
    findByDocumento: jest.fn(),
  };
  const typeormRepository = {
    findOne: jest.fn(),
  };
  let adapter: ClienteLookupAdapter;

  beforeEach(() => {
    adapter = new ClienteLookupAdapter(
      clienteRepository as never,
      typeormRepository as never,
    );
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

  it('retorna snapshot incluindo soft-deleted quando solicitado', async () => {
    const deletedAt = new Date('2026-02-01');
    typeormRepository.findOne.mockResolvedValue({
      id: 'cli-1',
      documento: '39053344705',
      nome: 'João',
      email: 'joao@example.com',
      celularNumero: '11999999999',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt,
    });

    await expect(
      adapter.findSnapshotById('cli-1', { includeDeleted: true }),
    ).resolves.toEqual({
      id: 'cli-1',
      documento: '39053344705',
      nome: 'João',
      email: 'joao@example.com',
      celularNumero: '11999999999',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt,
    });
  });

  it('retorna null quando cliente não existe no snapshot', async () => {
    typeormRepository.findOne.mockResolvedValue(null);

    await expect(adapter.findSnapshotById('nope')).resolves.toBeNull();
  });

  it('propaga erro inesperado ao validar documento', async () => {
    const unexpected = new Error('falha interna');
    jest.spyOn(ClienteDocumento, 'create').mockImplementationOnce(() => {
      throw unexpected;
    });

    await expect(
      adapter.resolveClienteIdByDocumento('39053344705'),
    ).rejects.toThrow(unexpected);
  });
});
