import {
  Body,
  Controller,
  Delete,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { type AuthenticatedRequest } from '../../../auth/presentation/interfaces/authenticated-request.interface';
import { FiltrosEstoqueDto } from '../dto/filtros-estoque.dto';
import { CreateEstoqueUseCase } from '../../application/use-cases/create-estoque.use-case';
import { ExecutarOperacaoEstoqueUseCase } from '../../application/use-cases/executar-operacao-estoque.use-case';
import { FindAllEstoquesUseCase } from '../../application/use-cases/find-all-estoques.use-case';
import { FindEstoqueByIdUseCase } from '../../application/use-cases/find-estoque-by-id.use-case';
import { RegistrarReposicaoEstoqueUseCase } from '../../application/use-cases/registrar-reposicao-estoque.use-case';
import { RemoveEstoqueUseCase } from '../../application/use-cases/remove-estoque.use-case';
import { UpdateEstoqueUseCase } from '../../application/use-cases/update-estoque.use-case';
import { CreateEstoqueDto } from '../dto/create-estoque.dto';
import { EstoqueResponseDto } from '../dto/estoque-response.dto';
import {
  OperacaoEstoqueDto,
  TipoOperacaoEstoque,
} from '../dto/operacao-estoque.dto';
import { UpdateEstoqueDto } from '../dto/update-estoque.dto';
import { EstoquePresentationMapper } from '../mappers/estoque-presentation.mapper';

@ApiBearerAuth('JWT-auth')
@ApiTags('Estoque')
@Controller('estoque')
export class EstoqueController {
  constructor(
    private readonly createEstoqueUseCase: CreateEstoqueUseCase,
    private readonly findAllEstoquesUseCase: FindAllEstoquesUseCase,
    private readonly findEstoqueByIdUseCase: FindEstoqueByIdUseCase,
    private readonly updateEstoqueUseCase: UpdateEstoqueUseCase,
    private readonly registrarReposicaoEstoqueUseCase: RegistrarReposicaoEstoqueUseCase,
    private readonly executarOperacaoEstoqueUseCase: ExecutarOperacaoEstoqueUseCase,
    private readonly removeEstoqueUseCase: RemoveEstoqueUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo item de estoque',
    description: 'Cria um novo item (peça ou insumo) no estoque.',
  })
  @ApiBody({ type: CreateEstoqueDto })
  @ApiResponse({ status: 201, description: 'Item criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({
    status: 409,
    description: 'Código já está em uso por outro item de estoque.',
  })
  async create(@Body() createEstoqueDto: CreateEstoqueDto) {
    const output = await this.createEstoqueUseCase.execute(
      EstoquePresentationMapper.toCreateInput(createEstoqueDto),
    );
    return EstoqueResponseDto.fromDomain(output);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar itens de estoque com paginação',
    description:
      'Retorna uma lista paginada de itens do estoque. Use estoque_baixo=true para filtrar itens com estoque baixo.',
  })
  @ApiResponse({ status: 200, description: 'Lista de itens retornada.' })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de paginação inválidos.',
  })
  async findAll(@Query() filtros: FiltrosEstoqueDto) {
    const result = await this.findAllEstoquesUseCase.execute(
      EstoquePresentationMapper.toFindAllInput(filtros),
    );
    return {
      data: result.data.map(EstoqueResponseDto.fromDomain),
      meta: result.meta,
    };
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
    const output = await this.findEstoqueByIdUseCase.execute(id);
    return EstoqueResponseDto.fromDomain(output);
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
  @ApiResponse({
    status: 409,
    description: 'Código já está em uso por outro item de estoque.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstoqueDto: UpdateEstoqueDto,
  ) {
    await this.updateEstoqueUseCase.execute(
      id,
      EstoquePresentationMapper.toUpdateInput(updateEstoqueDto),
    );
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
  @ApiResponse({ status: 409, description: 'Conflito de operação.' })
  async executarOperacao(
    @Res({ passthrough: true }) res: Response,
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OperacaoEstoqueDto,
  ) {
    if (dto.operacao === TipoOperacaoEstoque.REPOSICAO) {
      const atualizado = await this.registrarReposicaoEstoqueUseCase.execute(
        id,
        EstoquePresentationMapper.toReposicaoInput(
          dto.quantidade,
          req.user.sub,
        ),
      );
      res.status(HttpStatus.CREATED);
      return {
        success: true,
        message: `Reposição de ${dto.quantidade}.`,
        data: EstoqueResponseDto.fromDomain(atualizado),
      };
    }

    const item = await this.executarOperacaoEstoqueUseCase.execute(
      id,
      EstoquePresentationMapper.toOperacaoInput(dto),
    );
    return {
      success: true,
      message: 'Operação executada com sucesso.',
      data: EstoqueResponseDto.fromDomain(item),
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover item de estoque',
    description:
      'Remove um item de estoque (soft delete). Só é permitido quando quantidade física e reservada estão zeradas.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID do item de estoque',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Item removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Item de estoque não encontrado.' })
  @ApiResponse({
    status: 400,
    description:
      'Item possui quantidade física ou reservada e não pode ser removido.',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.removeEstoqueUseCase.execute(id);
    return {
      success: true,
      message: 'Item de estoque removido com sucesso.',
    };
  }
}
