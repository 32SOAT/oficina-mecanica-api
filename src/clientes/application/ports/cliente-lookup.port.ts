export type ClienteSnapshot = {
  id: string;
  documento: string;
  nome: string;
  email: string;
  celularNumero: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export const CLIENTE_LOOKUP_PORT = 'CLIENTE_LOOKUP_PORT';

export abstract class ClienteLookupPort {
  abstract resolveClienteIdByDocumento(documento: string): Promise<string>;

  abstract findSnapshotById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ClienteSnapshot | null>;
}
