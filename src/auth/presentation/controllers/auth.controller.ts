import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { Public } from '../decorators/public.decorator';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { IssueAuthTokenUseCase } from '../../application/use-cases/issue-auth-token.use-case';
import { ValidateCredentialsUseCase } from '../../application/use-cases/validate-credentials.use-case';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { AuthPresentationMapper } from '../mappers/auth-presentation.mapper';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly validateCredentialsUseCase: ValidateCredentialsUseCase,
    private readonly issueAuthTokenUseCase: IssueAuthTokenUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Login do administrador',
    description: 'Autentica administrador com email e senha, retorna token JWT',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Usuário autenticado e token JWT.',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.validateCredentialsUseCase.execute(
      AuthPresentationMapper.toValidateCredentialsInput(loginDto),
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return LoginResponseDto.fromReadModel(this.issueAuthTokenUseCase.execute(user));
  }

  @ApiBearerAuth('JWT-auth')
  @Patch('password')
  @ApiOperation({
    summary: 'Alterar senha do administrador',
    description:
      'Permite o administrador autenticado alterar sua própria senha',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso.' })
  @ApiResponse({
    status: 401,
    description:
      'Não autenticado (token ausente, inválido ou expirado) ou senha atual incorreta.',
  })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.changePasswordUseCase.execute(
      AuthPresentationMapper.toChangePasswordInput(
        req.user.sub,
        changePasswordDto,
      ),
    );

    return { success: true, message: 'Senha alterada com sucesso.' };
  }
}
