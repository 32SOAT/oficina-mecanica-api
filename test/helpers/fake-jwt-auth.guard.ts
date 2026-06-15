import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

export const E2E_AUTH_USER_STUB = Object.freeze({
  sub: 'e2e-user',
  email: 'e2e@test',
  username: 'e2e',
});

@Injectable()
export class FakeJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ user: typeof E2E_AUTH_USER_STUB }>();
    req.user = { ...E2E_AUTH_USER_STUB };
    return true;
  }
}
