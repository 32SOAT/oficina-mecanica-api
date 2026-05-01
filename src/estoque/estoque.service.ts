import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { PaginationService } from '../querying/pagination.service';
import { EstoqueEntity } from './estoque.entity';
import { CreateEstoqueDto } from './dtos/create-estoque.dto';
import { UpdateEstoqueDto } from './dtos/update-estoque.dto';
import {
  TipoOperacaoEstoque,
  OperacaoEstoqueDto,
} from './dtos/operacao-estoque.dto';

@Injectable()
export class EstoqueService {
  constructor(
    @InjectRepository(EstoqueEntity)
    private readonly estoqueRepository: Repository<EstoqueEntity>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createEstoqueDto: CreateEstoqueDto): Promise<EstoqueEntity> {
    const duplicate = await this.estoqueRepository.findOne({
      where: { codigo: createEstoqueDto.codigo },
    });
    if (duplicate) {
      throw new ConflictException(
        'Código já está em uso por outro item de estoque.',
      );
    }
    const item = this.estoqueRepository.create(createEstoqueDto);
    return this.estoqueRepository.save(item);
  }

  async findAll(paginationDto: PaginationDto, estoqueBaixo?: boolean) {
    const page = Number(paginationDto.page ?? 1);
    const take = Number(paginationDto.take ?? DefaultPageSize.ESTOQUE);
    const offset = this.paginationService.calculateOffset(take, page);

    const queryBuilder = this.estoqueRepository
      .createQueryBuilder('estoque')
      .where('estoque.deleted_at IS NULL');

    if (estoqueBaixo) {
      queryBuilder.andWhere(
        '(estoque.quantidade_fisica - estoque.quantidade_reservada) <= 5',
      );
    }

    queryBuilder.skip(offset).take(take);

    const [data, count] = await queryBuilder.getManyAndCount();
    const meta = this.paginationService.createMeta(take, page, count);
    return { data, meta };
  }

  async findOne(id: number): Promise<EstoqueEntity> {
    const item = await this.estoqueRepository.findOneBy({ id });
    if (!item) {
      throw new HttpException('Item de estoque não encontrado.', 404);
    }
    return item;
  }

  async findByCodigo(codigo: string): Promise<EstoqueEntity> {
    const item = await this.estoqueRepository.findOne({ where: { codigo } });
    if (!item) {
      throw new HttpException('Item de estoque não encontrado.', 404);
    }
    return item;
  }

  async update(
    id: number,
    updateEstoqueDto: UpdateEstoqueDto,
  ): Promise<EstoqueEntity> {
    const existing = await this.findOne(id);

    if (
      updateEstoqueDto.codigo &&
      updateEstoqueDto.codigo !== existing.codigo
    ) {
      const duplicate = await this.estoqueRepository.findOne({
        where: { codigo: updateEstoqueDto.codigo },
      });
      if (duplicate) {
        throw new ConflictException(
          'Código já está em uso por outro item de estoque.',
        );
      }
    }

    const merged = this.estoqueRepository.merge(existing, updateEstoqueDto);
    return this.estoqueRepository.save(merged);
  }

  async executarOperacao(
    id: number,
    operacaoDto: OperacaoEstoqueDto,
  ): Promise<EstoqueEntity> {
    const item = await this.findOne(id);

    if (operacaoDto.operacao === TipoOperacaoEstoque.RESERVAR) {
      item.reservar(operacaoDto.quantidade);
    } else {
      item.darBaixa(operacaoDto.quantidade);
    }

    return this.estoqueRepository.save(item);
  }

  async remove(id: number): Promise<EstoqueEntity> {
    const existing = await this.findOne(id);
    return this.estoqueRepository.softRemove(existing);
  }
}
