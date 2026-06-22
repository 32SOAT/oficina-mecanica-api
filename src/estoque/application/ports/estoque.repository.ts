import { Estoque } from '../../domain/estoque';

export const ESTOQUE_REPOSITORY = 'ESTOQUE_REPOSITORY';

export abstract class EstoqueRepository {
  abstract save(estoque: Estoque): Promise<Estoque>;
  abstract findAll(
    skip: number,
    take: number,
    estoqueBaixo?: boolean,
  ): Promise<[Estoque[], number]>;
  abstract findById(id: number): Promise<Estoque | null>;
  abstract existsByCodigo(codigo: string, excludeId?: number): Promise<boolean>;
  abstract softRemove(estoque: Estoque): Promise<Estoque>;
}
