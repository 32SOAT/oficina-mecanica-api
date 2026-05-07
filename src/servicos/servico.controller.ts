import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServicoService } from './servico.service';
import { ServicoEntity } from './servico.entity';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { CreateServicoDto } from './dtos/create-servico.dto';
import { UpdateServicoDto } from './dtos/update-servico.dto';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiWrappedResponse,
} from '../common/decorators/swagger-response.decorator';

@ApiBearerAuth('JWT-auth')
@ApiTags('Serviços')
@Controller('servicos')
export class ServicoController {
  constructor(private readonly servicoService: ServicoService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo serviço',
    description: 'Cria um novo serviço com nome, descrição e preço.',
  })
  @ApiBody({ type: CreateServicoDto })
  @ApiDataResponse(ServicoEntity, 201, 'Serviço criado com sucesso')
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Serviço com este nome já existe' })
  async create(@Body() createServicoDto: CreateServicoDto) {
    return this.servicoService.create(createServicoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar serviços com paginação',
    description: 'Retorna uma lista paginada de serviços ativos.',
  })
  @ApiPaginatedResponse(ServicoEntity, 200, 'Lista de serviços retornada')
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.servicoService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar serviço por ID',
    description: 'Busca um serviço ativo pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único do serviço',
    example: 1,
  })
  @ApiWrappedResponse(ServicoEntity, 200, 'Serviço encontrado com sucesso')
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.servicoService.findOne(id);
    return {
      success: true,
      data,
      message: 'Serviço encontrado com sucesso.',
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar serviço',
    description: 'Atualiza os dados de um serviço existente.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único do serviço',
    example: 1,
  })
  @ApiBody({ type: UpdateServicoDto })
  @ApiWrappedResponse(undefined, 200, 'Serviço atualizado com sucesso')
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  @ApiResponse({ status: 409, description: 'Serviço com este nome já existe' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServicoDto: UpdateServicoDto,
  ) {
    await this.servicoService.update(id, updateServicoDto);
    return {
      success: true,
      message: 'Serviço atualizado com sucesso.',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover serviço',
    description: 'Remove um serviço (soft delete).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único do serviço',
    example: 1,
  })
  @ApiWrappedResponse(undefined, 200, 'Serviço removido com sucesso')
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.servicoService.remove(id);
    return {
      success: true,
      message: 'Serviço removido com sucesso.',
    };
  }
}
