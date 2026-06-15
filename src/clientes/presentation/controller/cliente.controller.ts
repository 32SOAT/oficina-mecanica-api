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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginationDto } from '../../../querying/dtos/pagination.dto';
import { PaginationService } from '../../../querying/pagination.service';
import { CreateClienteDto } from '../dtos/create-cliente.dto';
import { FindClienteByDocumentDto } from '../dtos/find-cliente-by-document.dto';
import { UpdateClienteDto } from '../dtos/update-cliente.dto';
import { ClienteResponseDto } from '../dtos/cliente-response.dto';
import { CreateClienteUseCase } from '../../application/use-cases/create-cliente.use-case';
import { FindAllClientesUseCase } from '../../application/use-cases/find-all-clientes.use-case';
import { FindClienteByDocumentoUseCase } from '../../application/use-cases/find-cliente-by-documento.use-case';
import { UpdateClienteUseCase } from '../../application/use-cases/update-cliente.use-case';
import { RemoveClienteUseCase } from '../../application/use-cases/remove-cliente.use-case';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiWrappedResponse,
} from '../../../common/decorators/swagger-response.decorator';

@ApiBearerAuth()
@ApiTags('Clientes')
@Controller('clientes')
export class ClienteController {
  constructor(
    private readonly createClienteUseCase: CreateClienteUseCase,
    private readonly findAllClientesUseCase: FindAllClientesUseCase,
    private readonly findClienteByDocumentoUseCase: FindClienteByDocumentoUseCase,
    private readonly updateClienteUseCase: UpdateClienteUseCase,
    private readonly removeClienteUseCase: RemoveClienteUseCase,
    private readonly paginationService: PaginationService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo cliente',
    description: 'Cria um novo cliente com os dados fornecidos.',
  })
  @ApiBody({ type: CreateClienteDto })
  @ApiDataResponse(ClienteResponseDto, 201, 'Cliente criado com sucesso')
  @ApiResponse({
    status: 409,
    description: 'Documento já está em uso por outro cliente.',
  })
  async create(@Body() createClienteDto: CreateClienteDto) {
    const cliente = await this.createClienteUseCase.execute(createClienteDto);
    return ClienteResponseDto.fromDomain(cliente);
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
    description: 'Número da página (inicia em 1).',
    example: 1,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Limite de itens por página.',
    example: 10,
  })
  @ApiPaginatedResponse(ClienteResponseDto, 200, 'Lista de clientes retornada')
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.findAllClientesUseCase.execute(paginationDto);
    return {
      data: result.data.map((cliente) =>
        ClienteResponseDto.fromDomain(cliente),
      ),
      meta: this.paginationService.createMeta(
        result.take,
        result.page,
        result.count,
      ),
    };
  }

  @Post('by-document')
  @ApiOperation({
    summary: 'Buscar cliente por documento',
    description: 'Busca um cliente ativo pelo documento (CPF ou CNPJ).',
  })
  @ApiBody({ type: FindClienteByDocumentDto })
  @ApiWrappedResponse(ClienteResponseDto, 200, 'Cliente encontrado com sucesso')
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  async findByDocumento(
    @Body() findClienteByDocumentDto: FindClienteByDocumentDto,
  ) {
    const cliente = await this.findClienteByDocumentoUseCase.execute(
      findClienteByDocumentDto.documento,
    );
    return {
      success: true,
      data: ClienteResponseDto.fromDomain(cliente),
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
    await this.updateClienteUseCase.execute(id, updateClienteDto);
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
    await this.removeClienteUseCase.execute(id);
    return {
      success: true,
      message: 'Cliente removido com sucesso.',
    };
  }
}
