import { Cliente } from '../domain/cliente';

export const CLIENTE_REPOSITORY = 'CLIENTE_REPOSITORY';

export interface ClienteRepository {
  save(cliente: Cliente): Promise<Cliente>;
  findAll(skip: number, take: number): Promise<[Cliente[], number]>;
  findByDocumento(documento: string): Promise<Cliente | null>;
  findById(id: string): Promise<Cliente | null>;
  existsByDocumento(documento: string, excludeId?: string): Promise<boolean>;
  softRemove(cliente: Cliente): Promise<Cliente>;
}
