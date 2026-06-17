import { UserOutput } from '../dto/user.dto';
import { User } from '../../domain/user';

export class UserOutputMapper {
  static toDomain(output: UserOutput, password?: string): User {
    return new User({
      id: output.id,
      username: output.username,
      email: output.email,
      password,
    });
  }
}
