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
} from '@nestjs/swagger';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { VeiculoService } from './veiculo.service';
import { VeiculoEntity } from './veiculo.entity';
import { CreateVeiculoDto } from './dtos/create-veiculo.dto';
import { UpdateVeiculoDto } from './dtos/update-veiculo.dto';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiWrappedResponse,
} from '../common/decorators/swagger-response.decorator';

@ApiTags('Veículos')
@Controller('veiculos')
export class VeiculoController {
  constructor(private readonly veiculoService: VeiculoService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar novo veículo',
    description: 'Cria um novo veículo vinculado a um cliente existente.',
  })
  @ApiBody({ type: CreateVeiculoDto })
  @ApiDataResponse(VeiculoEntity, 201, 'Veículo criado com sucesso')
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa já cadastrada' })
  async create(@Body() createVeiculoDto: CreateVeiculoDto) {
    return this.veiculoService.create(createVeiculoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar veículos com paginação',
    description: 'Retorna uma lista paginada de veículos ativos.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (inicia em 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Limite de itens por página',
    example: 10,
  })
  @ApiPaginatedResponse(VeiculoEntity, 200, 'Lista de veículos retornada')
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.veiculoService.findAll(paginationDto);
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
  @ApiWrappedResponse(VeiculoEntity, 200, 'Veículo encontrado com sucesso')
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findByPlaca(@Param('placa') placa: string) {
    const data = await this.veiculoService.findByPlaca(placa);
    return {
      success: true,
      data,
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
    @Body() updateVeiculoDto: UpdateVeiculoDto,
  ) {
    await this.veiculoService.update(id, updateVeiculoDto);
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
    await this.veiculoService.remove(id);
    return {
      success: true,
      message: 'Veículo removido com sucesso.',
    };
  }
}
