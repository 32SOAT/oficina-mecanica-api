import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../common/application/errors/application.errors';
import { EntityManager } from 'typeorm';
import { ClienteTransactionalPort } from '../../application/ports/cliente-transactional.port';
import { ClienteTypeormEntity } from '../typeorm/entity/cliente.typeorm.entity';

@Injectable()
export class ClienteTransactionalAdapter implements ClienteTransactionalPort {
  async findIdByDocumento(
    em: EntityManager,
    documento: string,
  ): Promise<string> {
    const cliente = await em.findOne(ClienteTypeormEntity, {
      where: { documento },
    });
    if (!cliente) {
      throw new NotFoundError('Cliente não encontrado.');
    }
    return cliente.id;
  }
}
