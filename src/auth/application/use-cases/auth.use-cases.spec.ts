import { UnauthorizedError } from '../../../common/application/errors/application.errors';
import { ValidateCredentialsUseCase } from './validate-credentials.use-case';
import { ChangePasswordUseCase } from './change-password.use-case';
import { IssueAuthTokenUseCase } from './issue-auth-token.use-case';

describe('ValidateCredentialsUseCase', () => {
  let useCase: ValidateCredentialsUseCase;
  const authUserRepository = {
    findByEmailWithPassword: jest.fn(),
  };
  const passwordHasher = {
    compare: jest.fn(),
    hash: jest.fn(),
  };

  const mockUser = {
    id: 'user-id',
    username: 'admin',
    email: 'admin@oficina.com',
    passwordHash: 'hashed-password',
  };

  beforeEach(() => {
    useCase = new ValidateCredentialsUseCase(
      authUserRepository as never,
      passwordHasher as never,
    );
    jest.clearAllMocks();
  });

  it('returns user without password when credentials are valid', async () => {
    authUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'admin@oficina.com',
      password: 'admin123',
    });

    expect(result).toEqual({
      id: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
    });
    expect(result).not.toHaveProperty('password');
  });

  it('throws UnauthorizedError when user is not found', async () => {
    authUserRepository.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'notfound@example.com',
        password: 'password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when password is incorrect', async () => {
    authUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'admin@oficina.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('IssueAuthTokenUseCase', () => {
  it('returns user data and jwt token', () => {
    const tokenService = { sign: jest.fn().mockReturnValue('jwt-token') };
    const useCase = new IssueAuthTokenUseCase(tokenService as never);
    const user = {
      id: 'user-id',
      username: 'admin',
      email: 'admin@oficina.com',
    };

    const result = useCase.execute(user);

    expect(result.user).toEqual(user);
    expect(result.token).toBe('jwt-token');
    expect(tokenService.sign).toHaveBeenCalledWith({
      sub: user.id,
      role: 'admin',
      email: user.email,
      username: user.username,
    });
  });
});

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  const authUserRepository = {
    findByIdWithPassword: jest.fn(),
    updatePassword: jest.fn(),
  };
  const passwordHasher = {
    compare: jest.fn(),
    hash: jest.fn(),
  };

  const mockUser = {
    id: 'user-id',
    username: 'admin',
    email: 'admin@oficina.com',
    passwordHash: 'hashed-password',
  };

  beforeEach(() => {
    useCase = new ChangePasswordUseCase(
      authUserRepository as never,
      passwordHasher as never,
    );
    jest.clearAllMocks();
  });

  it('updates the password when current password is correct', async () => {
    authUserRepository.findByIdWithPassword.mockResolvedValue(mockUser);
    passwordHasher.compare.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('new-hashed-password');

    await useCase.execute({
      userId: 'user-id',
      currentPassword: 'admin123',
      newPassword: 'newPassword',
    });

    expect(authUserRepository.updatePassword).toHaveBeenCalledWith(
      'user-id',
      'new-hashed-password',
    );
  });

  it('throws UnauthorizedError when user is not found', async () => {
    authUserRepository.findByIdWithPassword.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'missing-id',
        currentPassword: 'admin123',
        newPassword: 'newPassword',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when current password is incorrect', async () => {
    authUserRepository.findByIdWithPassword.mockResolvedValue(mockUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-id',
        currentPassword: 'wrong-password',
        newPassword: 'newPassword',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
