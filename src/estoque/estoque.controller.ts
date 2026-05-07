import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ValidationPipe,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { type AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { EstoqueService } from './estoque.service';
import { CreateEstoqueDto } from './dtos/create-estoque.dto';
import {
  OperacaoEstoqueDto,
  TipoOperacaoEstoque,
} from './dtos/operacao-estoque.dto';
import { UpdateEstoqueDto } from './dtos/update-estoque.dto';

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

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar parcialmente item de estoque',
    description:
      'Atualiza apenas os campos cadastrais do item: código, peça/insumo e preço unitário. Alterações de quantidade devem ser feitas na rota PATCH de operações.',
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
    @Body() body: Record<string, unknown>,
  ) {
    if (
      'quantidadeFisica' in body ||
      'quantidadeReservada' in body ||
      'quantidadeResrvada' in body
    ) {
      throw new BadRequestException(
        'quantidadeFisica/quantidadeReservada não podem ser alteradas neste endpoint. Use PATCH /estoque/:id/operacao.',
      );
    }

    const updateEstoqueDto = (await new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }).transform(body, {
      type: 'body',
      metatype: UpdateEstoqueDto,
    })) as UpdateEstoqueDto;

    await this.estoqueService.update(id, updateEstoqueDto);
    return {
      success: true,
      message: 'Item de estoque atualizado com sucesso.',
    };
  }

  @Patch(':id/operacao')
  @ApiOperation({
    summary: 'Executar operação de estoque',
    description: 'Inclui `reposicao`, `reservar` e `baixa`.',
  })
  @ApiBody({ type: OperacaoEstoqueDto })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID do item (obrigatório para todas as operações).',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Operação executada com sucesso.' })
  @ApiResponse({
    status: 201,
    description: 'Item atualizado após reposição.',
  })
  @ApiResponse({ status: 404, description: 'Item de estoque não encontrado.' })
  @ApiResponse({
    status: 400,
    description: 'Estoque insuficiente ou dados inválidos.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito de operação.',
  })
  async executarOperacao(
    @Res({ passthrough: true }) res: Response,
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OperacaoEstoqueDto,
  ) {
    if (dto.operacao === TipoOperacaoEstoque.REPOSICAO) {
      const atualizado = await this.estoqueService.registrarReposicaoEstoque(
        id,
        { quantidade: dto.quantidade },
        req.user.sub,
      );
      res.status(HttpStatus.CREATED);
      return {
        success: true,
        message: `Reposição de ${dto.quantidade}.`,
        data: atualizado,
      };
    }

    const item = await this.estoqueService.executarOperacao(id, dto);
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
