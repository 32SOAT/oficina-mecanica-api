import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ServicoLookupPort,
  ServicoSnapshot,
} from '../../application/ports/servico-lookup.port';
import { ServicoTypeormEntity } from '../typeorm/entity/servico.typeorm.entity';

@Injectable()
export class ServicoLookupAdapter implements ServicoLookupPort {
  constructor(
    @InjectRepository(ServicoTypeormEntity)
    private readonly repository: Repository<ServicoTypeormEntity>,
  ) {}

  async findSnapshotById(
    id: number,
    options?: { includeDeleted?: boolean },
  ): Promise<ServicoSnapshot | null> {
    const servico = await this.repository.findOne({
      where: { id },
      withDeleted: options?.includeDeleted ?? false,
    });
    if (!servico) {
      return null;
    }
    return {
      id: servico.id,
      servico: servico.servico,
      descricao: servico.descricao,
      precoMaoDeObra: Number(servico.precoMaoDeObra),
    };
  }
}
