import { NotFoundError } from '../../../common/application/errors/application.errors';
import { CreateUserUseCase } from './create-user.use-case';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { RemoveUserUseCase } from './remove-user.use-case';
import type { UserRepository } from '../ports/user.repository';
import { User } from '../../domain/user';

const makeUser = (overrides: Partial<ConstructorParameters<typeof User>[0]> = {}) =>
  User.create({
    id: 'user-id',
    username: 'jane',
    email: 'jane@example.com',
    ...overrides,
  });

describe('User use cases', () => {
  describe('CreateUserUseCase', () => {
    const userRepository = { save: jest.fn() };
    const useCase = new CreateUserUseCase(
      userRepository as unknown as UserRepository,
    );

    it('creates user', async () => {
      const saved = makeUser();
      userRepository.save.mockResolvedValue(saved);
      const result = await useCase.execute({
        username: 'jane',
        email: 'jane@example.com',
        password: 'secret',
      });
      expect(result).toEqual(saved);
    });
  });

  describe('FindUserByIdUseCase', () => {
    const userRepository = { findById: jest.fn() };
    const useCase = new FindUserByIdUseCase(
      userRepository as unknown as UserRepository,
    );

    it('returns user', async () => {
      const user = makeUser();
      userRepository.findById.mockResolvedValue(user);
      await expect(useCase.execute('user-id')).resolves.toEqual(user);
    });

    it('throws NotFoundError when not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('UpdateUserUseCase', () => {
    const userRepository = { findById: jest.fn(), save: jest.fn() };
    const useCase = new UpdateUserUseCase(
      userRepository as unknown as UserRepository,
    );

    it('updates user', async () => {
      const existing = makeUser();
      const updated = makeUser({ email: 'new@example.com' });
      userRepository.findById.mockResolvedValue(existing);
      userRepository.save.mockResolvedValue(updated);

      const result = await useCase.execute('user-id', {
        email: 'new@example.com',
      });
      expect(result.email).toBe('new@example.com');
    });

    it('throws NotFoundError when not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(
        useCase.execute('missing', { email: 'x@y.com' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('RemoveUserUseCase', () => {
    const userRepository = { findById: jest.fn(), remove: jest.fn() };
    const useCase = new RemoveUserUseCase(
      userRepository as unknown as UserRepository,
    );

    it('removes user', async () => {
      const user = makeUser();
      userRepository.findById.mockResolvedValue(user);
      userRepository.remove.mockResolvedValue(user);
      await expect(useCase.execute('user-id')).resolves.toEqual(user);
    });

    it('throws NotFoundError when not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
