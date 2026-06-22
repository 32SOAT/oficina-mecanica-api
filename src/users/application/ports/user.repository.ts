import { User } from '../../domain/user';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export abstract class UserRepository {
  abstract save(user: User): Promise<User>;
  abstract findAll(skip: number, take: number): Promise<[User[], number]>;
  abstract findById(id: string): Promise<User | null>;
  abstract remove(user: User): Promise<User>;
}
