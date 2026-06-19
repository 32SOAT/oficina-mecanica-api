import { EntityManager } from 'typeorm';

export const SERVICO_TRANSACTIONAL_PORT = 'SERVICO_TRANSACTIONAL_PORT';

export type ServicoPrecoSnapshot = {
  servicoId: number;
  precoAplicado: number;
};

export abstract class ServicoTransactionalPort {
  abstract findPreco(
    em: EntityManager,
    servicoId: number,
  ): Promise<ServicoPrecoSnapshot>;
}
