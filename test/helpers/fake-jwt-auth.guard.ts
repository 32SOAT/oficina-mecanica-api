import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

export const E2E_AUTH_USER_STUB = Object.freeze({
  sub: 'e2e-user',
  role: 'admin' as const,
  email: 'e2e@test',
  username: 'e2e',
});

export const E2E_AUTH_CLIENTE_STUB = Object.freeze({
  sub: 'e2e-cliente',
  role: 'cliente' as const,
  cpf: '52998224725',
});

export const E2E_CLIENTE_AUTHORIZATION = 'Bearer cliente';

@Injectable()
export class FakeJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
      user: typeof E2E_AUTH_USER_STUB | typeof E2E_AUTH_CLIENTE_STUB;
    }>();
    const authorization = req.headers?.authorization;
    req.user =
      authorization === E2E_CLIENTE_AUTHORIZATION
        ? { ...E2E_AUTH_CLIENTE_STUB }
        : { ...E2E_AUTH_USER_STUB };
    return true;
  }
}
