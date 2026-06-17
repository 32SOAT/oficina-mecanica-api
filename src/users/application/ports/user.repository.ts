import { UserOutput } from '../dto/user.dto';
import { User } from '../../domain/user';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export abstract class UserRepository {
  abstract save(user: User): Promise<UserOutput>;
  abstract findAll(
    skip: number,
    take: number,
  ): Promise<[UserOutput[], number]>;
  abstract findById(id: string): Promise<UserOutput | null>;
  abstract remove(user: User): Promise<UserOutput>;
}
