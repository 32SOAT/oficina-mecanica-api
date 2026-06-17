import { Estoque } from '../../domain/estoque';
import { EstoqueOutput } from '../dto/estoque.output';

export const ESTOQUE_REPOSITORY = 'ESTOQUE_REPOSITORY';

export abstract class EstoqueRepository {
  abstract save(estoque: Estoque): Promise<EstoqueOutput>;
  abstract findAll(
    skip: number,
    take: number,
    estoqueBaixo?: boolean,
  ): Promise<[EstoqueOutput[], number]>;
  abstract findById(id: number): Promise<EstoqueOutput | null>;
  abstract existsByCodigo(codigo: string, excludeId?: number): Promise<boolean>;
  abstract softRemove(estoque: Estoque): Promise<EstoqueOutput>;
}
