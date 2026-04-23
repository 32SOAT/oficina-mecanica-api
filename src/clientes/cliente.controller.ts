import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { FindClienteByDocumentDto } from './dtos/find-cliente-by-document.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';

@ApiTags('Clientes')
@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo cliente',
    description: 'Cria um novo cliente com os dados fornecidos.',
  })
  @ApiBody({ type: CreateClienteDto })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou documento já existe',
  })
  async create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar clientes com paginação',
    description: 'Retorna uma lista paginada de clientes ativos.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (inicia em 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de itens por página',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Lista de clientes retornada' })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de paginação inválidos',
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.clienteService.findAll(paginationDto);
  }

  @Post('by-document')
  @ApiOperation({
    summary: 'Buscar cliente por documento',
    description: 'Busca um cliente ativo pelo documento (CPF ou CNPJ).',
  })
  @ApiBody({ type: FindClienteByDocumentDto })
  @ApiResponse({ status: 200, description: 'Cliente encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 400, description: 'Documento inválido' })
  async findByDocumento(
    @Body() findClienteByDocumentDto: FindClienteByDocumentDto,
  ) {
    const data = await this.clienteService.findByDocumento(
      findClienteByDocumentDto.documento,
    );
    return {
      success: true,
      data,
      message: 'Client Fetched Successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar cliente',
    description: 'Atualiza os dados de um cliente existente.',
  })
  @ApiBody({ type: UpdateClienteDto })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID único do cliente (UUID)',
    example: 'uuid-string',
  })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    await this.clienteService.update(id, updateClienteDto);
    return {
      success: true,
      message: 'Client Updated Successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover cliente',
    description: 'Remove um cliente (soft delete).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID único do cliente (UUID)',
    example: 'uuid-string',
  })
  @ApiResponse({ status: 200, description: 'Cliente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.clienteService.remove(id);
    return {
      success: true,
      message: 'Client Deleted Successfully',
    };
  }
}
