import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { PaginationService } from '../querying/pagination.service';
import { ClienteService } from '../clientes/cliente.service';
import { isValidBrazilianPlate, normalizePlate } from './br-plate.validator';
import { VeiculoEntity } from './veiculo.entity';
import { CreateVeiculoDto } from './dtos/create-veiculo.dto';
import { UpdateVeiculoDto } from './dtos/update-veiculo.dto';

@Injectable()
export class VeiculoService {
  constructor(
    @InjectRepository(VeiculoEntity)
    private readonly veiculoRepository: Repository<VeiculoEntity>,
    private readonly paginationService: PaginationService,
    private readonly clienteService: ClienteService,
  ) {}

  async create(createVeiculoDto: CreateVeiculoDto): Promise<VeiculoEntity> {
    const placa = normalizePlate(createVeiculoDto.placa);
    if (!isValidBrazilianPlate(placa)) {
      throw new BadRequestException('Invalid plate');
    }
    const duplicate = await this.veiculoRepository.findOne({
      where: { placa },
    });
    if (duplicate) {
      throw new ConflictException('Plate is already registered');
    }
    const cliente = await this.clienteService.findByDocumento(createVeiculoDto.documentoCliente);
    const veiculoData = this.veiculoRepository.create({
      placa,
      marca: createVeiculoDto.marca,
      modelo: createVeiculoDto.modelo,
      ano: createVeiculoDto.ano,
      cliente_id: cliente.id,
    });
    return this.veiculoRepository.save(veiculoData);
  }

  async findAll(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const take = paginationDto.take ?? DefaultPageSize.VEICULO;
    const offset = this.paginationService.calculateOffset(take, page);
    const [data, count] = await this.veiculoRepository.findAndCount({
      skip: offset,
      take,
    });
    const meta = this.paginationService.createMeta(take, page, count);
    return {
      data,
      meta,
    };
  }

  async findOne(id: string): Promise<VeiculoEntity> {
    const veiculo = await this.veiculoRepository.findOneBy({ id });
    if (!veiculo) {
      throw new HttpException('Vehicle Not Found', 404);
    }
    return veiculo;
  }

  async findByPlaca(placaRaw: string): Promise<VeiculoEntity> {
    const placa = normalizePlate(placaRaw);
    if (!isValidBrazilianPlate(placa)) {
      throw new BadRequestException('Invalid plate');
    }
    const veiculo = await this.veiculoRepository.findOne({
      where: { placa },
    });
    if (!veiculo) {
      throw new HttpException('Vehicle Not Found', 404);
    }
    return veiculo;
  }

  async update(
    id: string,
    updateVeiculoDto: UpdateVeiculoDto,
  ): Promise<VeiculoEntity> {
    const existingVeiculo = await this.findOne(id);
    const veiculoData = this.veiculoRepository.merge(
      existingVeiculo,
      updateVeiculoDto,
    );
    veiculoData.placa = existingVeiculo.placa;
    veiculoData.cliente_id = existingVeiculo.cliente_id;
    return this.veiculoRepository.save(veiculoData);
  }

  async remove(id: string): Promise<VeiculoEntity> {
    const existingVeiculo = await this.findOne(id);
    return this.veiculoRepository.softRemove(existingVeiculo);
  }
}