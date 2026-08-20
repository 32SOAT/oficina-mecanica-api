import { parseJwtPayload } from './jwt-payload';

describe('parseJwtPayload', () => {
  it('aceita token de cliente da Lambda', () => {
    expect(
      parseJwtPayload({
        sub: 'cliente-1',
        cpf: '52998224725',
        role: 'cliente',
      }),
    ).toEqual({
      sub: 'cliente-1',
      cpf: '52998224725',
      role: 'cliente',
    });
  });

  it('aceita token de admin com role', () => {
    expect(
      parseJwtPayload({
        sub: 'user-1',
        role: 'admin',
        email: 'admin@oficina.com',
        username: 'admin',
      }),
    ).toEqual({
      sub: 'user-1',
      role: 'admin',
      email: 'admin@oficina.com',
      username: 'admin',
    });
  });

  it('aceita token legado de admin sem role', () => {
    expect(
      parseJwtPayload({
        sub: 'user-1',
        email: 'admin@oficina.com',
        username: 'admin',
      }),
    ).toEqual({
      sub: 'user-1',
      role: 'admin',
      email: 'admin@oficina.com',
      username: 'admin',
    });
  });

  it('rejeita cliente sem cpf', () => {
    expect(parseJwtPayload({ sub: 'cliente-1', role: 'cliente' })).toBeNull();
  });

  it('rejeita role desconhecida', () => {
    expect(
      parseJwtPayload({ sub: 'x', role: 'mecanico', email: 'a@b.c' }),
    ).toBeNull();
  });
});
