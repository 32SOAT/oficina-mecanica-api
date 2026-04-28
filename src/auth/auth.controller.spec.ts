import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';
import { LoginResponseDto } from './dtos/login-response.dto';
import type { AuthenticatedRequest } from './authenticated-request.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let validateUser: jest.Mock;
  let login: jest.Mock;
  let changePassword: jest.Mock;

  beforeEach(() => {
    validateUser = jest.fn();
    login = jest.fn();
    changePassword = jest.fn();

    const authService = {
      validateUser,
      login,
      changePassword,
    } as unknown as AuthService;

    controller = new AuthController(authService);
  });

  describe('login', () => {
    it('returns token on valid credentials', async () => {
      const user = { id: '1', username: 'admin', email: 'admin@oficina.com' };
      const loginResponse = new LoginResponseDto();
      loginResponse.user = user;
      loginResponse.token = 'jwt-token';
      validateUser.mockResolvedValue(user);
      login.mockReturnValue(loginResponse);

      const result = await controller.login({
        email: 'admin@oficina.com',
        password: 'admin123',
      });

      expect(result).toEqual(loginResponse);
      expect(validateUser).toHaveBeenCalledWith(
        'admin@oficina.com',
        'admin123',
      );
    });

    it('throws UnauthorizedException on invalid credentials', async () => {
      validateUser.mockResolvedValue(null);

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
      changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(req, {
        currentPassword: 'old',
        newPassword: 'new',
      });

      expect(changePassword).toHaveBeenCalledWith('user-id', 'old', 'new');
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
