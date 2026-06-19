import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginResponseDto } from '../dto/login-response.dto';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { ValidateCredentialsUseCase } from '../../application/use-cases/validate-credentials.use-case';
import { IssueAuthTokenUseCase } from '../../application/use-cases/issue-auth-token.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { AuthPresentationMapper } from '../mappers/auth-presentation.mapper';

describe('AuthController', () => {
  let controller: AuthController;
  const validateCredentialsUseCase = { execute: jest.fn() };
  const issueAuthTokenUseCase = { execute: jest.fn() };
  const changePasswordUseCase = { execute: jest.fn() };

  beforeEach(() => {
    controller = new AuthController(
      validateCredentialsUseCase as unknown as ValidateCredentialsUseCase,
      issueAuthTokenUseCase as unknown as IssueAuthTokenUseCase,
      changePasswordUseCase as unknown as ChangePasswordUseCase,
    );
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns token on valid credentials', async () => {
      const user = { id: '1', username: 'admin', email: 'admin@oficina.com' };
      const loginOutput = { user, token: 'jwt-token' };
      validateCredentialsUseCase.execute.mockResolvedValue(user);
      issueAuthTokenUseCase.execute.mockReturnValue(loginOutput);

      const dto = { email: 'admin@oficina.com', password: 'admin123' };
      const result = await controller.login(dto);

      expect(result).toEqual(LoginResponseDto.fromReadModel(loginOutput));
      expect(validateCredentialsUseCase.execute).toHaveBeenCalledWith(
        AuthPresentationMapper.toValidateCredentialsInput(dto),
      );
      expect(issueAuthTokenUseCase.execute).toHaveBeenCalledWith(user);
    });

    it('throws UnauthorizedException on invalid credentials', async () => {
      validateCredentialsUseCase.execute.mockResolvedValue(null);

      await expect(
        controller.login({ email: 'admin@oficina.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('calls changePassword with user id from token', async () => {
      const req = {
        user: { sub: 'user-id', email: 'admin@oficina.com', username: 'admin' },
      } as AuthenticatedRequest;
      const dto = { currentPassword: 'old', newPassword: 'new' };

      const result = await controller.changePassword(req, dto);

      expect(changePasswordUseCase.execute).toHaveBeenCalledWith(
        AuthPresentationMapper.toChangePasswordInput('user-id', dto),
      );
      expect(result).toEqual({
        success: true,
        message: 'Senha alterada com sucesso.',
      });
    });
  });
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let verifyAsync: jest.Mock;
  let reflector: Reflector;

  beforeEach(() => {
    verifyAsync = jest.fn();
    const jwtService = { verifyAsync } as unknown as JwtService;
    reflector = new Reflector();
    guard = new JwtAuthGuard(jwtService, reflector);
  });

  const createExecutionContext = (
    headers: Record<string, string>,
    isPublic = false,
  ) => {
    const handler = () => {};
    const cls = class {};

    if (isPublic) {
      Reflect.defineMetadata('isPublic', true, handler);
    }

    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
      getHandler: () => handler,
      getClass: () => cls,
    } as never;
  };

  it('allows access for public routes', async () => {
    const context = createExecutionContext({}, true);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('throws when no token is provided', async () => {
    const context = createExecutionContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws when token is invalid', async () => {
    verifyAsync.mockRejectedValue(new Error('invalid'));
    const context = createExecutionContext({
      authorization: 'Bearer invalid-token',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows access with valid token', async () => {
    const payload = {
      sub: 'user-id',
      email: 'admin@oficina.com',
      username: 'admin',
    };
    verifyAsync.mockResolvedValue(payload);

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const handler = () => {};
    const cls = class {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => handler,
      getClass: () => cls,
    } as never;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(req).toHaveProperty('user', payload);
  });
});
