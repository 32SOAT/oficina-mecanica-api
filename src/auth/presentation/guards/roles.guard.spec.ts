import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '../../../common/application/errors/application.errors';
import { Public } from '../decorators/public.decorator';
import { AuthController } from '../controllers/auth.controller';
import { ConsultaOrdemServicoController } from '../../../ordens-de-servico/presentation/controllers/consulta-ordem-servico.controller';
import { OrdemServicoController } from '../../../ordens-de-servico/presentation/controllers/ordem-servico.controller';
import type { JwtPayload } from '../interfaces/authenticated-request.interface';
import { RolesGuard } from './roles.guard';

const adminUser: JwtPayload = {
  sub: 'user-1',
  role: 'admin',
  email: 'admin@oficina.com',
  username: 'admin',
};

const clienteUser: JwtPayload = {
  sub: 'cliente-1',
  role: 'cliente',
  cpf: '52998224725',
};

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  const createContext = (handler: () => unknown, user?: JwtPayload) => {
    const cls = class {};
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => handler,
      getClass: () => cls,
    } as never;
  };

  it('allows public routes without a user', () => {
    class Handler {
      @Public()
      run() {}
    }

    expect(guard.canActivate(createContext(Handler.prototype.run))).toBe(true);
  });

  it('allows admin on routes without @Roles (default admin)', () => {
    const handler = () => {};
    expect(guard.canActivate(createContext(handler, adminUser))).toBe(true);
  });

  it('rejects cliente on routes without @Roles (default admin)', () => {
    const handler = () => {};
    expect(() =>
      guard.canActivate(createContext(handler, clienteUser)),
    ).toThrow(ForbiddenError);
  });

  it('rejects cliente JWT on PATCH /auth/password', () => {
    expect(() =>
      guard.canActivate(
        createContext(AuthController.prototype.changePassword, clienteUser),
      ),
    ).toThrow(ForbiddenError);
  });

  it('allows admin JWT on PATCH /auth/password', () => {
    expect(
      guard.canActivate(
        createContext(AuthController.prototype.changePassword, adminUser),
      ),
    ).toBe(true);
  });

  it('allows login without a user because it is public', () => {
    expect(
      guard.canActivate(createContext(AuthController.prototype.login)),
    ).toBe(true);
  });

  it('allows cliente JWT on OS status, approve and reject', () => {
    expect(
      guard.canActivate(
        createContext(
          ConsultaOrdemServicoController.prototype.consultarStatus,
          clienteUser,
        ),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        createContext(
          OrdemServicoController.prototype.aprovarOrcamento,
          clienteUser,
        ),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        createContext(
          OrdemServicoController.prototype.reprovarOrcamento,
          clienteUser,
        ),
      ),
    ).toBe(true);
  });

  it('rejects admin JWT on OS status, approve and reject', () => {
    expect(() =>
      guard.canActivate(
        createContext(
          ConsultaOrdemServicoController.prototype.consultarStatus,
          adminUser,
        ),
      ),
    ).toThrow(ForbiddenError);
    expect(() =>
      guard.canActivate(
        createContext(
          OrdemServicoController.prototype.aprovarOrcamento,
          adminUser,
        ),
      ),
    ).toThrow(ForbiddenError);
    expect(() =>
      guard.canActivate(
        createContext(
          OrdemServicoController.prototype.reprovarOrcamento,
          adminUser,
        ),
      ),
    ).toThrow(ForbiddenError);
  });
});
