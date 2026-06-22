import { EntityManager } from 'typeorm';

export const VEICULO_TRANSACTIONAL_PORT = 'VEICULO_TRANSACTIONAL_PORT';

export abstract class VeiculoTransactionalPort {
  abstract findIdForCliente(
    em: EntityManager,
    placa: string,
    clienteId: string,
  ): Promise<string>;
}
