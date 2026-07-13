export type ServicoSnapshot = {
  id: number;
  servico: string;
  descricao?: string;
  precoMaoDeObra: number;
};

export const SERVICO_LOOKUP_PORT = 'SERVICO_LOOKUP_PORT';

export abstract class ServicoLookupPort {
  abstract findSnapshotById(
    id: number,
    options?: { includeDeleted?: boolean },
  ): Promise<ServicoSnapshot | null>;
}
