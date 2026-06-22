import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { EntityManager } from 'typeorm';
import {
  ServicoPrecoSnapshot,
  ServicoTransactionalPort,
} from '../../application/ports/servico-transactional.port';
import { ServicoTypeormEntity } from '../typeorm/entity/servico.typeorm.entity';

@Injectable()
export class ServicoTransactionalAdapter implements ServicoTransactionalPort {
  async findPreco(
    em: EntityManager,
    servicoId: number,
  ): Promise<ServicoPrecoSnapshot> {
    const srv = await em.findOne(ServicoTypeormEntity, {
      where: { id: servicoId },
    });
    if (!srv) {
      throw new NotFoundError(`Serviço ${servicoId} não encontrado.`);
    }
    return {
      servicoId: srv.id,
      precoAplicado: Number(srv.precoMaoDeObra),
    };
  }
}
