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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { ClienteService } from './cliente.service';
import { ClienteEntity } from './cliente.entity';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { FindClienteByDocumentDto } from './dtos/find-cliente-by-document.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiWrappedResponse,
} from '../common/decorators/swagger-response.decorator';

@ApiBearerAuth('JWT-auth')
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
  @ApiDataResponse(ClienteEntity, 201, 'Cliente criado com sucesso')
  @ApiResponse({
    status: 409,
    description: 'Documento já está em uso por outro cliente.',
  })
  async create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar clientes com paginação',
    description: 'Retorna uma lista paginada de clientes ativos.',
  })
  @ApiPaginatedResponse(ClienteEntity, 200, 'Lista de clientes retornada')
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.clienteService.findAll(paginationDto);
  }

  @Post('by-document')
  @ApiOperation({
    summary: 'Buscar cliente por documento',
    description: 'Busca um cliente ativo pelo documento (CPF ou CNPJ).',
  })
  @ApiBody({ type: FindClienteByDocumentDto })
  @ApiWrappedResponse(ClienteEntity, 200, 'Cliente encontrado com sucesso')
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async findByDocumento(
    @Body() findClienteByDocumentDto: FindClienteByDocumentDto,
  ) {
    const data = await this.clienteService.findByDocumento(
      findClienteByDocumentDto.documento,
    );
    return {
      success: true,
      data,
      message: 'Cliente encontrado com sucesso.',
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar cliente',
    description: 'Atualiza os dados de um cliente existente.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID único do cliente (UUID)',
    example: 'uuid-string',
  })
  @ApiBody({ type: UpdateClienteDto })
  @ApiWrappedResponse(undefined, 200, 'Cliente atualizado com sucesso')
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Documento já está em uso por outro cliente.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    await this.clienteService.update(id, updateClienteDto);
    return {
      success: true,
      message: 'Cliente atualizado com sucesso.',
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
  @ApiWrappedResponse(undefined, 200, 'Cliente removido com sucesso')
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.clienteService.remove(id);
    return {
      success: true,
      message: 'Cliente removido com sucesso.',
    };
  }
}
