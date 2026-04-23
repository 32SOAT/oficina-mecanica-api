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
  @ApiTags('Clientes')
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiBody({ type: CreateClienteDto })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  async create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  @Get()
  @ApiTags('Clientes')
  @ApiOperation({ summary: 'Listar clientes com paginação' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.clienteService.findAll(paginationDto);
  }

  @Post('by-document')
  @ApiTags('Clientes')
  @ApiOperation({ summary: 'Buscar cliente por documento' })
  @ApiBody({ type: FindClienteByDocumentDto })
  @ApiResponse({ status: 200, description: 'Cliente encontrado com sucesso' })
  async findByDocumento(
    @Body() findClienteByDocumentDto: FindClienteByDocumentDto
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
  @ApiTags('Clientes')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiBody({ type: UpdateClienteDto })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
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
  @ApiTags('Clientes')
  @ApiOperation({ summary: 'Remover cliente' })
  @ApiResponse({ status: 200, description: 'Cliente removido com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.clienteService.remove(id);
    return {
      success: true,
      message: 'Client Deleted Successfully',
    };
  }
}
