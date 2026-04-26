import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { PaginationService } from '../querying/pagination.service';
import { PecaEntity } from './peca.entity';
import { CreatePecaDto } from './dtos/create-peca.dto';
import { UpdatePecaDto } from './dtos/update-peca.dto';
import {
  TipoOperacaoEstoque,
  UpdateEstoqueDto,
} from './dtos/update-estoque.dto';

@Injectable()
export class PecaService {
  constructor(
    @InjectRepository(PecaEntity)
    private readonly pecaRepository: Repository<PecaEntity>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createPecaDto: CreatePecaDto): Promise<PecaEntity> {
    const duplicate = await this.pecaRepository.findOne({
      where: { codigo: createPecaDto.codigo },
    });
    if (duplicate) {
      throw new ConflictException('Código já está em uso por outra peça.');
    }
    const peca = this.pecaRepository.create(createPecaDto);
    return this.pecaRepository.save(peca);
  }

  async findAll(paginationDto: PaginationDto, estoqueBaixo?: boolean) {
    const page = Number(paginationDto.page ?? 1);
    const take = Number(paginationDto.take ?? DefaultPageSize.PECA);
    const offset = this.paginationService.calculateOffset(take, page);

    const queryBuilder = this.pecaRepository
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

  async findOne(id: number): Promise<PecaEntity> {
    const peca = await this.pecaRepository.findOneBy({ id });
    if (!peca) {
      throw new HttpException('Peça não encontrada.', 404);
    }
    return peca;
  }

  async findByCodigo(codigo: string): Promise<PecaEntity> {
    const peca = await this.pecaRepository.findOne({ where: { codigo } });
    if (!peca) {
      throw new HttpException('Peça não encontrada.', 404);
    }
    return peca;
  }

  async update(id: number, updatePecaDto: UpdatePecaDto): Promise<PecaEntity> {
    const existingPeca = await this.findOne(id);

    if (updatePecaDto.codigo && updatePecaDto.codigo !== existingPeca.codigo) {
      const duplicate = await this.pecaRepository.findOne({
        where: { codigo: updatePecaDto.codigo },
      });
      if (duplicate) {
        throw new ConflictException('Código já está em uso por outra peça.');
      }
    }

    const pecaData = this.pecaRepository.merge(existingPeca, updatePecaDto);
    return this.pecaRepository.save(pecaData);
  }

  async updateEstoque(
    id: number,
    updateEstoqueDto: UpdateEstoqueDto,
  ): Promise<PecaEntity> {
    const peca = await this.findOne(id);

    if (updateEstoqueDto.operacao === TipoOperacaoEstoque.RESERVAR) {
      peca.reservar(updateEstoqueDto.quantidade);
    } else {
      peca.darBaixa(updateEstoqueDto.quantidade);
    }

    return this.pecaRepository.save(peca);
  }

  async remove(id: number): Promise<PecaEntity> {
    const existingPeca = await this.findOne(id);
    return this.pecaRepository.softRemove(existingPeca);
  }
}
