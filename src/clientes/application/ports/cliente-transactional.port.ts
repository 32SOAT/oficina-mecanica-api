import { EntityManager } from 'typeorm';

export const CLIENTE_TRANSACTIONAL_PORT = 'CLIENTE_TRANSACTIONAL_PORT';

export abstract class ClienteTransactionalPort {
  abstract findIdByDocumento(
    em: EntityManager,
    documento: string,
  ): Promise<string>;
}
