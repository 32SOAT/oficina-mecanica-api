import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  it('signs payload via JwtService', () => {
    const jwtService = { sign: jest.fn().mockReturnValue('token') };
    const service = new JwtTokenService(jwtService as never);
    const payload = { sub: 'user-id', email: 'a@b.com' };

    expect(service.sign(payload)).toBe('token');
    expect(jwtService.sign).toHaveBeenCalledWith(payload);
  });
});
