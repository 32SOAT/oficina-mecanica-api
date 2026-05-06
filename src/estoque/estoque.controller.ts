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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { EstoqueService } from './estoque.service';
import { CreateEstoqueDto } from './dtos/create-estoque.dto';
import { UpdateEstoqueDto } from './dtos/update-estoque.dto';
import { OperacaoEstoqueDto } from './dtos/operacao-estoque.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Estoque')
@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo item de estoque',
    description: 'Cria um novo item (peça ou insumo) no estoque.',
  })
  @ApiBody({ type: CreateEstoqueDto })
  @ApiResponse({ status: 201, description: 'Item criado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos.',
  })
  @ApiResponse({
    status: 409,
    description: 'Código já está em uso por outro item de estoque.',
  })
  async create(@Body() createEstoqueDto: CreateEstoqueDto) {
    return this.estoqueService.create(createEstoqueDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar itens de estoque com paginação',
    description:
      'Retorna uma lista paginada de itens do estoque. Use estoque_baixo=true para filtrar itens com estoque baixo.',
  })
  @ApiQuery({
    name: 'estoque_baixo',
    required: false,
    type: Boolean,
    description: 'Filtrar itens com estoque baixo (disponível <= 5).',
    example: false,
  })
  @ApiResponse({ status: 200, description: 'Lista de itens retornada.' })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de paginação inválidos.',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('estoque_baixo') estoqueBaixo?: string,
  ) {
    return this.estoqueService.findAll(paginationDto, estoqueBaixo === 'true');
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar item de estoque por ID',
    description: 'Retorna um item de estoque pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID do item de estoque',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Item encontrado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Item de estoque não encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estoqueService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar item de estoque',
    description: 'Atualiza os dados de um item de estoque existente.',
  })
  @ApiBody({ type: UpdateEstoqueDto })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID do item de estoque',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Item atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Item de estoque não encontrado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstoqueDto: UpdateEstoqueDto,
  ) {
    await this.estoqueService.update(id, updateEstoqueDto);
    return {
      success: true,
      message: 'Item de estoque atualizado com sucesso.',
    };
  }

  @Patch(':id/operacao')
  @ApiOperation({
    summary: 'Executar operação de estoque',
    description: 'Realiza operações de reserva ou baixa em um item de estoque.',
  })
  @ApiBody({ type: OperacaoEstoqueDto })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID do item de estoque',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Operação executada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Item de estoque não encontrado.' })
  @ApiResponse({
    status: 400,
    description: 'Estoque insuficiente ou dados inválidos.',
  })
  async executarOperacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() operacaoDto: OperacaoEstoqueDto,
  ) {
    const item = await this.estoqueService.executarOperacao(id, operacaoDto);
    return {
      success: true,
      message: 'Operação executada com sucesso.',
      data: item,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover item de estoque',
    description: 'Remove um item de estoque (soft delete).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID do item de estoque',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Item removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Item de estoque não encontrado.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.estoqueService.remove(id);
    return {
      success: true,
      message: 'Item de estoque removido com sucesso.',
    };
  }
}
