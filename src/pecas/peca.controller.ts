import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
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
import { PecaService } from './peca.service';
import { CreatePecaDto } from './dtos/create-peca.dto';
import { UpdatePecaDto } from './dtos/update-peca.dto';
import { UpdateEstoqueDto } from './dtos/update-estoque.dto';

@ApiTags('Peças e Insumos')
@Controller('pecas')
export class PecaController {
  constructor(private readonly pecaService: PecaService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar nova peça/insumo',
    description: 'Cria uma nova peça ou insumo no estoque.',
  })
  @ApiBody({ type: CreatePecaDto })
  @ApiResponse({ status: 201, description: 'Peça criada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos.',
  })
  @ApiResponse({
    status: 409,
    description: 'Código já está em uso por outra peça.',
  })
  async create(@Body() createPecaDto: CreatePecaDto) {
    return this.pecaService.create(createPecaDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar peças com paginação',
    description:
      'Retorna uma lista paginada de peças/insumos. Use estoque_baixo=true para filtrar itens com estoque baixo.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (inicia em 1).',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de itens por página.',
    example: 10,
  })
  @ApiQuery({
    name: 'estoque_baixo',
    required: false,
    type: Boolean,
    description: 'Filtrar peças com estoque baixo (disponível <= 5).',
    example: false,
  })
  @ApiResponse({ status: 200, description: 'Lista de peças retornada.' })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de paginação inválidos.',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('estoque_baixo') estoqueBaixo?: string,
  ) {
    return this.pecaService.findAll(paginationDto, estoqueBaixo === 'true');
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar peça por ID',
    description: 'Retorna uma peça/insumo pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID da peça',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Peça encontrada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Peça não encontrada.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pecaService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar peça',
    description: 'Atualiza os dados de uma peça/insumo existente.',
  })
  @ApiBody({ type: UpdatePecaDto })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID da peça',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Peça atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Peça não encontrada.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePecaDto: UpdatePecaDto,
  ) {
    await this.pecaService.update(id, updatePecaDto);
    return {
      success: true,
      message: 'Peça atualizada com sucesso.',
    };
  }

  @Patch(':id/estoque')
  @ApiOperation({
    summary: 'Ajustar estoque',
    description:
      'Realiza operações de reserva ou baixa no estoque de uma peça/insumo.',
  })
  @ApiBody({ type: UpdateEstoqueDto })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID da peça',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Estoque atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Peça não encontrada.' })
  @ApiResponse({
    status: 400,
    description: 'Estoque insuficiente ou dados inválidos.',
  })
  async updateEstoque(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstoqueDto: UpdateEstoqueDto,
  ) {
    const peca = await this.pecaService.updateEstoque(id, updateEstoqueDto);
    return {
      success: true,
      message: 'Estoque atualizado com sucesso.',
      data: peca,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover peça',
    description: 'Remove uma peça/insumo (soft delete).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID da peça',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Peça removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Peça não encontrada.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.pecaService.remove(id);
    return {
      success: true,
      message: 'Peça removida com sucesso.',
    };
  }
}
