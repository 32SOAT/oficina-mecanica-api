import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../../../common/application/errors/application.errors';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type {
  AuthRole,
  AuthenticatedRequest,
} from '../interfaces/authenticated-request.interface';

const DEFAULT_ROLES: AuthRole[] = ['admin'];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles =
      this.reflector.getAllAndOverride<AuthRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_ROLES;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.user?.role;

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenError('Acesso negado para este perfil.');
    }

    return true;
  }
}
