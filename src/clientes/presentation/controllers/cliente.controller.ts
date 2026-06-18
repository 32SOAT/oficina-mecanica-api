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
import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { CreateClienteDto } from '../dto/create-cliente.dto';
import { FindClienteByDocumentDto } from '../dto/find-cliente-by-document.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import { ClienteResponseDto } from '../dto/cliente-response.dto';
import { ClientePresentationMapper } from '../mappers/cliente-presentation.mapper';
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

@ApiBearerAuth('JWT-auth')
@ApiTags('Clientes')
@Controller('clientes')
export class ClienteController {
  constructor(
    private readonly createClienteUseCase: CreateClienteUseCase,
    private readonly findAllClientesUseCase: FindAllClientesUseCase,
    private readonly findClienteByDocumentoUseCase: FindClienteByDocumentoUseCase,
    private readonly updateClienteUseCase: UpdateClienteUseCase,
    private readonly removeClienteUseCase: RemoveClienteUseCase,
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
    const output = await this.createClienteUseCase.execute(
      ClientePresentationMapper.toCreateInput(createClienteDto),
    );
    return ClienteResponseDto.fromOutput(output);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar clientes com paginação',
    description: 'Retorna uma lista paginada de clientes ativos.',
  })
  @ApiPaginatedResponse(ClienteResponseDto, 200, 'Lista de clientes retornada')
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.findAllClientesUseCase.execute(
      ClientePresentationMapper.toFindAllInput(paginationDto),
    );
    return {
      data: result.data.map((cliente) => ClienteResponseDto.fromOutput(cliente)),
      meta: result.meta,
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
      data: ClienteResponseDto.fromOutput(cliente),
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
    await this.updateClienteUseCase.execute(
      id,
      ClientePresentationMapper.toUpdateInput(updateClienteDto),
    );
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
