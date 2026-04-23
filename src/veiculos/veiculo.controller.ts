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
import { CreateVeiculoDto } from './dtos/create-veiculo.dto';
import { UpdateVeiculoDto } from './dtos/update-veiculo.dto';
import { FindVeiculoByPlacaDto } from './dtos/find-veiculo-by-placa.dto';

@ApiTags('Veículos')
@Controller('veiculos')
export class VeiculoController {
  constructor(private readonly veiculoService: VeiculoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo veículo', description: 'Cria um novo veículo vinculado a um cliente existente.' })
  @ApiBody({ type: CreateVeiculoDto })
  @ApiResponse({ status: 201, description: 'Veículo criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou placa inválida' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa já cadastrada' })
  async create(@Body() createVeiculoDto: CreateVeiculoDto) {
    return this.veiculoService.create(createVeiculoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar veículos com paginação', description: 'Retorna uma lista paginada de veículos ativos.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (inicia em 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de itens por página', example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de veículos retornada' })
  @ApiResponse({ status: 400, description: 'Parâmetros de paginação inválidos' })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.veiculoService.findAll(paginationDto);
  }

  @Post('by-placa')
  @ApiOperation({ summary: 'Buscar veículo por placa', description: 'Busca um veículo pela placa fornecida no body.' })
  @ApiBody({ type: FindVeiculoByPlacaDto })
  @ApiResponse({ status: 200, description: 'Veículo encontrado' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 400, description: 'Placa inválida' })
  async findByPlaca(@Body() findDto: FindVeiculoByPlacaDto) {
    return this.veiculoService.findByPlaca(findDto.placa);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar veículo', description: 'Atualiza os dados de um veículo existente.' })
  @ApiBody({ type: UpdateVeiculoDto })
  @ApiParam({ name: 'id', type: String, description: 'ID único do veículo (UUID)', example: 'uuid-string' })
  @ApiResponse({ status: 200, description: 'Veículo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVeiculoDto: UpdateVeiculoDto,
  ) {
    await this.veiculoService.update(id, updateVeiculoDto);
    return {
      success: true,
      message: 'Vehicle Updated Successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover veículo', description: 'Remove um veículo (soft delete).' })
  @ApiParam({ name: 'id', type: String, description: 'ID único do veículo (UUID)', example: 'uuid-string' })
  @ApiResponse({ status: 200, description: 'Veículo removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.veiculoService.remove(id);
    return {
      success: true,
      message: 'Vehicle Deleted Successfully',
    };
  }
}