import { Cliente } from '../../domain/cliente';

export const CLIENTE_REPOSITORY = 'CLIENTE_REPOSITORY';

export abstract class ClienteRepository {
  abstract save(cliente: Cliente): Promise<Cliente>;
  abstract findAll(skip: number, take: number): Promise<[Cliente[], number]>;
  abstract findByDocumento(documento: string): Promise<Cliente | null>;
  abstract findById(id: string): Promise<Cliente | null>;
  abstract existsByDocumento(documento: string, excludeId?: string): Promise<boolean>;
  abstract softRemove(cliente: Cliente): Promise<Cliente>;
}
