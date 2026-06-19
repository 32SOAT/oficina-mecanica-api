export type ValidateCredentialsInput = {
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export type TokenPayload = {
  sub: string;
  email: string;
  username: string;
};

export type {
  AuthenticatedUserReadModel,
  LoginReadModel,
  AuthenticatedUserOutput,
  LoginOutput,
} from '../read-models/auth-read-model';
