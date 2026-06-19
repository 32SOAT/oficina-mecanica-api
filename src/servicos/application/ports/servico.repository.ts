import { Servico } from '../../domain/servico';

export const SERVICO_REPOSITORY = 'SERVICO_REPOSITORY';

export abstract class ServicoRepository {
  abstract save(servico: Servico): Promise<Servico>;
  abstract findAll(skip: number, take: number): Promise<[Servico[], number]>;
  abstract findById(id: number): Promise<Servico | null>;
  abstract existsByNome(nome: string, excludeId?: number): Promise<boolean>;
  abstract softRemove(servico: Servico): Promise<Servico>;
}
