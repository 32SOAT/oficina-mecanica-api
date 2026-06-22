import { ChangePasswordInput, ValidateCredentialsInput } from '../../application/dto/auth.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';

export class AuthPresentationMapper {
  static toValidateCredentialsInput(dto: LoginDto): ValidateCredentialsInput {
    return {
      email: dto.email,
      password: dto.password,
    };
  }

  static toChangePasswordInput(
    userId: string,
    dto: ChangePasswordDto,
  ): ChangePasswordInput {
    return {
      userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    };
  }
}
