import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from '../../../common/pagination/pagination.dto';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiWrappedResponse,
} from '../../../common/decorators/swagger-response.decorator';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from '../../application/use-cases/find-all-users.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { RemoveUserUseCase } from '../../application/use-cases/remove-user.use-case';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserPresentationMapper } from '../mappers/user-presentation.mapper';

@ApiBearerAuth('JWT-auth')
@ApiTags('Usuários')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly removeUserUseCase: RemoveUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiBody({ type: CreateUserDto })
  @ApiDataResponse(UserResponseDto, 201, 'Usuário criado com sucesso.')
  async create(@Body() dto: CreateUserDto) {
    const output = await this.createUserUseCase.execute(
      UserPresentationMapper.toCreateInput(dto),
    );
    return UserResponseDto.fromOutput(output);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários com paginação' })
  @ApiPaginatedResponse(UserResponseDto, 200, 'Lista de usuários retornada.')
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.findAllUsersUseCase.execute(
      UserPresentationMapper.toFindAllInput(paginationDto),
    );
    return {
      data: result.data.map(UserResponseDto.fromOutput),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário (UUID)', format: 'uuid' })
  @ApiWrappedResponse(UserResponseDto, 200, 'Usuário encontrado.')
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async findOne(@Param('id') id: string) {
    const data = await this.findUserByIdUseCase.execute(id);
    return {
      success: true,
      data: UserResponseDto.fromOutput(data),
      message: 'Usuário obtido com sucesso.',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário (UUID)', format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @ApiWrappedResponse(undefined, 200, 'Usuário atualizado com sucesso.')
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    await this.updateUserUseCase.execute(
      id,
      UserPresentationMapper.toUpdateInput(dto),
    );
    return {
      success: true,
      message: 'Usuário atualizado com sucesso.',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário (UUID)', format: 'uuid' })
  @ApiWrappedResponse(undefined, 200, 'Usuário removido com sucesso.')
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async remove(@Param('id') id: string) {
    await this.removeUserUseCase.execute(id);
    return {
      success: true,
      message: 'Usuário removido com sucesso.',
    };
  }
}
