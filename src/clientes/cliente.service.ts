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
import { isValidBrazilianTaxId, normalizeTaxId } from './br-document.validator';
import { ClienteEntity } from './cliente.entity';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(ClienteEntity)
    private readonly clienteRepository: Repository<ClienteEntity>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<ClienteEntity> {
    const documento = normalizeTaxId(createClienteDto.documento);
    if (!isValidBrazilianTaxId(documento)) {
      throw new BadRequestException('CPF/CNPJ inválido.');
    }
    const duplicate = await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.documento = :documento', { documento })
      .andWhere('cliente.deletedAt IS NULL')
      .getOne();
    if (duplicate) {
      throw new ConflictException('CPF/CNPJ vinculado a outro cliente.');
    }
    const clienteData = this.clienteRepository.create({
      documento,
      nome: createClienteDto.nome,
      email: createClienteDto.email,
      celularNumero: createClienteDto.celularNumero,
    });
    return this.clienteRepository.save(clienteData);
  }

  async findAll(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page ?? 1);
    const take = Number(paginationDto.take ?? DefaultPageSize.CLIENTE);
    const offset = this.paginationService.calculateOffset(take, page);
    const [data, count] = await this.clienteRepository.findAndCount({
      skip: offset,
      take,
    });
    const meta = this.paginationService.createMeta(take, page, count);
    return {
      data,
      meta,
    };
  }

  async findByDocumento(documentoRaw: string): Promise<ClienteEntity> {
    const documento = normalizeTaxId(documentoRaw);
    if (!isValidBrazilianTaxId(documento)) {
      throw new BadRequestException('CPF/CNPJ inválido.');
    }
    const cliente = await this.clienteRepository.findOne({
      where: { documento },
    });
    if (!cliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    return cliente;
  }

  async findOne(id: string): Promise<ClienteEntity> {
    const cliente = await this.clienteRepository.findOneBy({ id });
    if (!cliente) {
      throw new HttpException('Cliente não encontrado.', 404);
    }
    return cliente;
  }

  async update(
    id: string,
    updateClienteDto: UpdateClienteDto,
  ): Promise<ClienteEntity> {
    const existingCliente = await this.findOne(id);
    const clienteData = this.clienteRepository.merge(
      existingCliente,
      updateClienteDto,
    );
    if (updateClienteDto.documento) {
      const documento = normalizeTaxId(updateClienteDto.documento);
      if (!isValidBrazilianTaxId(documento)) {
        throw new BadRequestException('CPF/CNPJ inválido.');
      }
      const duplicate = await this.clienteRepository
        .createQueryBuilder('cliente')
        .where('cliente.documento = :documento', { documento })
        .andWhere('cliente.deletedAt IS NULL')
        .andWhere('cliente.id != :id', { id })
        .getOne();
      if (duplicate) {
        throw new ConflictException('CPF/CNPJ vinculado a outro cliente.');
      }
      clienteData.documento = documento;
    } else {
      clienteData.documento = existingCliente.documento;
    }
    return this.clienteRepository.save(clienteData);
  }

  async remove(id: string): Promise<ClienteEntity> {
    const existingCliente = await this.findOne(id);
    return this.clienteRepository.softRemove(existingCliente);
  }
}
