import { Injectable } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
} from '../../../common/application/errors/application.errors';
import { EntityManager } from 'typeorm';
import { VeiculoTransactionalPort } from '../../application/ports/veiculo-transactional.port';
import { VeiculoTypeormEntity } from '../typeorm/entity/veiculo.typeorm.entity';

@Injectable()
export class VeiculoTransactionalAdapter implements VeiculoTransactionalPort {
  async findIdForCliente(
    em: EntityManager,
    placa: string,
    clienteId: string,
  ): Promise<string> {
    const veiculo = await em.findOne(VeiculoTypeormEntity, {
      where: { placa },
    });
    if (!veiculo) {
      throw new NotFoundError('Veículo não encontrado.');
    }
    if (veiculo.cliente_id !== clienteId) {
      throw new ConflictError('Veículo não pertence a este cliente.');
    }
    return veiculo.id;
  }
}
