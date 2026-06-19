export const CLIENTE_LOOKUP_PORT = 'CLIENTE_LOOKUP_PORT';

export abstract class ClienteLookupPort {
  abstract resolveClienteIdByDocumento(documento: string): Promise<string>;
}
