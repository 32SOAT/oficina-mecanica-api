import { Estoque } from '../../domain/estoque';
import { EstoqueTypeormEntity } from '../typeorm/entity/estoque.typeorm.entity';

export function applyEstoqueDomainMutation(
  entity: EstoqueTypeormEntity,
  mutate: (domain: Estoque) => Estoque,
): void {
  entity.applyFromDomain(mutate(entity.toDomain()));
}
