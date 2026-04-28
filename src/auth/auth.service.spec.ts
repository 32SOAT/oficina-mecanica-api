import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserEntity } from '../users/user.entity';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

type UserRepositoryMock = jest.Mocked<
  Pick<Repository<UserEntity>, 'createQueryBuilder' | 'update'>
>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: UserRepositoryMock;
  let jwtSign: jest.Mock;

  const mockUser: UserEntity = {
    id: 'user-id',
    username: 'admin',
    email: 'admin@oficina.com',
    password: 'hashed-password',
  };

  const createQueryBuilderMock = () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    return qb;
  };

  beforeEach(() => {
    userRepository = {
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    };

    jwtSign = jest.fn().mockReturnValue('jwt-token');

    const jwtService = { sign: jwtSign } as unknown as JwtService;

    service = new AuthService(
      userRepository as unknown as Repository<UserEntity>,
      jwtService,
    );
  });

  describe('validateUser', () => {
    it('returns user without password when credentials are valid', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue({ ...mockUser });
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'admin@oficina.com',
        'admin123',
      );

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      });
      expect(result).not.toHaveProperty('password');
      expect(qb.addSelect).toHaveBeenCalledWith('user.password');
    });

    it('returns null when user is not found', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.validateUser(
        'notfound@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('returns null when password is incorrect', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue({ ...mockUser });
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'admin@oficina.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns user data and jwt token', () => {
      const result = service.login(mockUser);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        token: 'jwt-token',
      });
      expect(jwtSign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });
  });

  describe('changePassword', () => {
    it('updates the password when current password is correct', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue({ ...mockUser });
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      (userRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.changePassword('user-id', 'admin123', 'newPassword');

      expect(userRepository.update).toHaveBeenCalledWith('user-id', {
        password: 'new-hashed-password',
      });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await expect(
        service.changePassword('missing-id', 'admin123', 'newPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when current password is incorrect', async () => {
      const qb = createQueryBuilderMock();
      qb.getOne.mockResolvedValue({ ...mockUser });
      (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-id', 'wrong-password', 'newPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
