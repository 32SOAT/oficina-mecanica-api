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
import { PaginationDto } from '../../../common/pagination/pagination.dto';
import { CreateServicoUseCase } from '../../application/use-cases/create-servico.use-case';
import { FindAllServicosUseCase } from '../../application/use-cases/find-all-servicos.use-case';
import { FindServicoByIdUseCase } from '../../application/use-cases/find-servico-by-id.use-case';
import { UpdateServicoUseCase } from '../../application/use-cases/update-servico.use-case';
import { RemoveServicoUseCase } from '../../application/use-cases/remove-servico.use-case';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiWrappedResponse,
} from '../../../common/decorators/swagger-response.decorator';
import { CreateServicoDto } from '../dto/create-servico.dto';
import { UpdateServicoDto } from '../dto/update-servico.dto';
import { ServicoResponseDto } from '../dto/servico-response.dto';
import { ServicoPresentationMapper } from '../mappers/servico-presentation.mapper';

@ApiBearerAuth('JWT-auth')
@ApiTags('Serviços')
@Controller('servicos')
export class ServicoController {
  constructor(
    private readonly createServicoUseCase: CreateServicoUseCase,
    private readonly findAllServicosUseCase: FindAllServicosUseCase,
    private readonly findServicoByIdUseCase: FindServicoByIdUseCase,
    private readonly updateServicoUseCase: UpdateServicoUseCase,
    private readonly removeServicoUseCase: RemoveServicoUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo serviço',
    description: 'Cria um novo serviço com nome, descrição e preço.',
  })
  @ApiBody({ type: CreateServicoDto })
  @ApiDataResponse(ServicoResponseDto, 201, 'Serviço criado com sucesso')
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Serviço com este nome já existe' })
  async create(@Body() dto: CreateServicoDto) {
    const output = await this.createServicoUseCase.execute(
      ServicoPresentationMapper.toCreateInput(dto),
    );
    return ServicoResponseDto.fromOutput(output);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar serviços com paginação',
    description: 'Retorna uma lista paginada de serviços ativos.',
  })
  @ApiPaginatedResponse(ServicoResponseDto, 200, 'Lista de serviços retornada')
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.findAllServicosUseCase.execute(
      ServicoPresentationMapper.toFindAllInput(paginationDto),
    );
    return {
      data: result.data.map(ServicoResponseDto.fromOutput),
      meta: result.meta,
    };
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
  @ApiWrappedResponse(ServicoResponseDto, 200, 'Serviço encontrado com sucesso')
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.findServicoByIdUseCase.execute(id);
    return {
      success: true,
      data: ServicoResponseDto.fromOutput(data),
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
    @Body() dto: UpdateServicoDto,
  ) {
    await this.updateServicoUseCase.execute(
      id,
      ServicoPresentationMapper.toUpdateInput(dto),
    );
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
    await this.removeServicoUseCase.execute(id);
    return {
      success: true,
      message: 'Serviço removido com sucesso.',
    };
  }
}
