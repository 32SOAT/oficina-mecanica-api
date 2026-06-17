import { Servico } from '../../domain/servico';
import { ServicoOutput } from '../dto/servico.output';

export const SERVICO_REPOSITORY = 'SERVICO_REPOSITORY';

export abstract class ServicoRepository {
  abstract save(servico: Servico): Promise<ServicoOutput>;
  abstract findAll(
    skip: number,
    take: number,
  ): Promise<[ServicoOutput[], number]>;
  abstract findById(id: number): Promise<ServicoOutput | null>;
  abstract existsByNome(nome: string, excludeId?: number): Promise<boolean>;
  abstract softRemove(servico: Servico): Promise<ServicoOutput>;
}
