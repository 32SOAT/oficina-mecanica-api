import {
  Injectable,
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { PaginationService } from '../querying/pagination.service';
import { ServicoEntity } from './servico.entity';
import { CreateServicoDto } from './dtos/create-servico.dto';
import { UpdateServicoDto } from './dtos/update-servico.dto';

@Injectable()
export class ServicoService {
  constructor(
    @InjectRepository(ServicoEntity)
    private readonly servicoRepository: Repository<ServicoEntity>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createServicoDto: CreateServicoDto): Promise<ServicoEntity> {
    // Verificar duplicata de nome de serviço (soft delete aware)
    const duplicate = await this.servicoRepository
      .createQueryBuilder('servico')
      .where('servico.servico = :nome', { nome: createServicoDto.servico })
      .andWhere('servico.deletedAt IS NULL')
      .getOne();

    if (duplicate) {
      throw new ConflictException('Serviço com este nome já existe.');
    }

    // Validar preço
    if (createServicoDto.precoMaoDeObra < 0) {
      throw new BadRequestException('Preço não pode ser negativo.');
    }

    const servicoData = this.servicoRepository.create(createServicoDto);
    return this.servicoRepository.save(servicoData);
  }

  async findAll(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page ?? 1);
    const take = Number(paginationDto.take ?? DefaultPageSize.SERVICO ?? 10);
    const offset = this.paginationService.calculateOffset(take, page);

    const [data, count] = await this.servicoRepository.findAndCount({
      skip: offset,
      take,
    });

    const meta = this.paginationService.createMeta(take, page, count);
    return {
      data,
      meta,
    };
  }

  async findOne(id: number): Promise<ServicoEntity> {
    const servico = await this.servicoRepository.findOneBy({ id });
    if (!servico) {
      throw new HttpException('Serviço não encontrado', 404);
    }
    return servico;
  }

  async update(
    id: number,
    updateServicoDto: UpdateServicoDto,
  ): Promise<ServicoEntity> {
    const existingServico = await this.findOne(id);

    // Se alterar nome, verificar duplicata
    if (updateServicoDto.servico) {
      const duplicate = await this.servicoRepository
        .createQueryBuilder('servico')
        .where('servico.servico = :nome', { nome: updateServicoDto.servico })
        .andWhere('servico.deletedAt IS NULL')
        .andWhere('servico.id != :id', { id })
        .getOne();

      if (duplicate) {
        throw new ConflictException('Serviço com este nome já existe.');
      }
    }

    // Validar preço se informado
    if (
      updateServicoDto.precoMaoDeObra !== undefined &&
      updateServicoDto.precoMaoDeObra < 0
    ) {
      throw new BadRequestException('Preço não pode ser negativo.');
    }

    const servicoData = this.servicoRepository.merge(
      existingServico,
      updateServicoDto,
    );
    return this.servicoRepository.save(servicoData);
  }

  async remove(id: number): Promise<ServicoEntity> {
    const existingServico = await this.findOne(id);
    return this.servicoRepository.softRemove(existingServico);
  }
}
