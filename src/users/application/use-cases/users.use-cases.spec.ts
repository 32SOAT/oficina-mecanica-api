import { HttpException, NotFoundException } from '@nestjs/common';
import { CreateUserUseCase } from './create-user.use-case';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { RemoveUserUseCase } from './remove-user.use-case';
import type { UserRepository } from '../ports/user.repository';

const output = {
  id: 'user-id',
  username: 'jane',
  email: 'jane@example.com',
};

describe('User use cases', () => {
  describe('CreateUserUseCase', () => {
    const userRepository = { save: jest.fn() };
    const useCase = new CreateUserUseCase(
      userRepository as unknown as UserRepository,
    );

    it('creates user', async () => {
      userRepository.save.mockResolvedValue(output);
      const result = await useCase.execute({
        username: 'jane',
        email: 'jane@example.com',
        password: 'secret',
      });
      expect(result).toEqual(output);
    });
  });

  describe('FindUserByIdUseCase', () => {
    const userRepository = { findById: jest.fn() };
    const useCase = new FindUserByIdUseCase(
      userRepository as unknown as UserRepository,
    );

    it('returns user', async () => {
      userRepository.findById.mockResolvedValue(output);
      await expect(useCase.execute('user-id')).resolves.toEqual(output);
    });

    it('throws when not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('UpdateUserUseCase', () => {
    const userRepository = { findById: jest.fn(), save: jest.fn() };
    const useCase = new UpdateUserUseCase(
      userRepository as unknown as UserRepository,
    );

    it('updates user', async () => {
      userRepository.findById.mockResolvedValue(output);
      userRepository.save.mockResolvedValue({
        ...output,
        email: 'new@example.com',
      });

      const result = await useCase.execute('user-id', {
        email: 'new@example.com',
      });
      expect(result.email).toBe('new@example.com');
    });

    it('throws when not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(
        useCase.execute('missing', { email: 'x@y.com' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('RemoveUserUseCase', () => {
    const userRepository = { findById: jest.fn(), remove: jest.fn() };
    const useCase = new RemoveUserUseCase(
      userRepository as unknown as UserRepository,
    );

    it('removes user', async () => {
      userRepository.findById.mockResolvedValue(output);
      userRepository.remove.mockResolvedValue(output);
      await expect(useCase.execute('user-id')).resolves.toEqual(output);
    });

    it('throws when not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
