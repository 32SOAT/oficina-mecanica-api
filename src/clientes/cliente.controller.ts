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
import { PaginationDto } from 'src/querying/dtos/pagination.dto';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dtos/create-cliente.dto';
import { FindClienteByDocumentDto } from './dtos/find-cliente-by-document.dto';
import { UpdateClienteDto } from './dtos/update-cliente.dto';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post('by-document')
  async findByDocumento(@Body() findClienteByDocumentDto: FindClienteByDocumentDto) {
    const data = await this.clienteService.findByDocumento(
      findClienteByDocumentDto.documento,
    );
    return {
      success: true,
      data,
      message: 'Client Fetched Successfully',
    };
  }

  @Post()
  async create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.clienteService.findAll(paginationDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    await this.clienteService.update(id, updateClienteDto);
    return {
      success: true,
      message: 'Client Updated Successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.clienteService.remove(id);
    return {
      success: true,
      message: 'Client Deleted Successfully',
    };
  }
}
