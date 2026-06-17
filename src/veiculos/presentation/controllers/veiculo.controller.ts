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
import { CreateVeiculoUseCase } from '../../application/use-cases/create-veiculo.use-case';
import { FindAllVeiculosUseCase } from '../../application/use-cases/find-all-veiculos.use-case';
import { FindVeiculoByPlacaUseCase } from '../../application/use-cases/find-veiculo-by-placa.use-case';
import { UpdateVeiculoUseCase } from '../../application/use-cases/update-veiculo.use-case';
import { RemoveVeiculoUseCase } from '../../application/use-cases/remove-veiculo.use-case';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiWrappedResponse,
} from '../../../common/decorators/swagger-response.decorator';
import { CreateVeiculoDto } from '../dto/create-veiculo.dto';
import { UpdateVeiculoDto } from '../dto/update-veiculo.dto';
import { VeiculoResponseDto } from '../dto/veiculo-response.dto';
import { VeiculoPresentationMapper } from '../mappers/veiculo-presentation.mapper';

@ApiBearerAuth('JWT-auth')
@ApiTags('Veículos')
@Controller('veiculos')
export class VeiculoController {
  constructor(
    private readonly createVeiculoUseCase: CreateVeiculoUseCase,
    private readonly findAllVeiculosUseCase: FindAllVeiculosUseCase,
    private readonly findVeiculoByPlacaUseCase: FindVeiculoByPlacaUseCase,
    private readonly updateVeiculoUseCase: UpdateVeiculoUseCase,
    private readonly removeVeiculoUseCase: RemoveVeiculoUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo veículo',
    description: 'Cria um novo veículo vinculado a um cliente existente.',
  })
  @ApiBody({ type: CreateVeiculoDto })
  @ApiDataResponse(VeiculoResponseDto, 201, 'Veículo criado com sucesso')
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa já cadastrada' })
  async create(@Body() dto: CreateVeiculoDto) {
    const output = await this.createVeiculoUseCase.execute(
      VeiculoPresentationMapper.toCreateInput(dto),
    );
    return VeiculoResponseDto.fromOutput(output);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar veículos com paginação',
    description: 'Retorna uma lista paginada de veículos ativos.',
  })
  @ApiPaginatedResponse(VeiculoResponseDto, 200, 'Lista de veículos retornada')
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.findAllVeiculosUseCase.execute(
      VeiculoPresentationMapper.toFindAllInput(paginationDto),
    );
    return {
      data: result.data.map(VeiculoResponseDto.fromOutput),
      meta: result.meta,
    };
  }

  @Get('placa/:placa')
  @ApiOperation({
    summary: 'Buscar veículo por placa',
    description: 'Busca um veículo pela placa fornecida na URL.',
  })
  @ApiParam({
    name: 'placa',
    type: String,
    description: 'Placa do veículo',
    example: 'ABC1234',
  })
  @ApiWrappedResponse(VeiculoResponseDto, 200, 'Veículo encontrado com sucesso')
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findByPlaca(@Param('placa') placa: string) {
    const data = await this.findVeiculoByPlacaUseCase.execute(placa);
    return {
      success: true,
      data: VeiculoResponseDto.fromOutput(data),
      message: 'Veículo encontrado com sucesso.',
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar veículo',
    description: 'Atualiza os dados de um veículo existente.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID único do veículo (UUID)',
    example: 'uuid-string',
  })
  @ApiBody({ type: UpdateVeiculoDto })
  @ApiWrappedResponse(undefined, 200, 'Veículo atualizado com sucesso')
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa já cadastrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVeiculoDto,
  ) {
    await this.updateVeiculoUseCase.execute(
      id,
      VeiculoPresentationMapper.toUpdateInput(dto),
    );
    return {
      success: true,
      message: 'Veículo atualizado com sucesso.',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover veículo',
    description: 'Remove um veículo (soft delete).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID único do veículo (UUID)',
    example: 'uuid-string',
  })
  @ApiWrappedResponse(undefined, 200, 'Veículo removido com sucesso')
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.removeVeiculoUseCase.execute(id);
    return {
      success: true,
      message: 'Veículo removido com sucesso.',
    };
  }
}
