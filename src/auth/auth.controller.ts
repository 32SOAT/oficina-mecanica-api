import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from './authenticated-request.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.authService.login(user);
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
    const userId: string = req.user.sub;
    await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return { success: true, message: 'Senha alterada com sucesso.' };
  }
}
