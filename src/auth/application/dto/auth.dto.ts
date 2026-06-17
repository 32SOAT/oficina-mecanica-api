export type ValidateCredentialsInput = {
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export type AuthenticatedUserOutput = {
  id: string;
  username: string;
  email: string;
};

export type LoginOutput = {
  user: AuthenticatedUserOutput;
  token: string;
};

export type TokenPayload = {
  sub: string;
  email: string;
  username: string;
};

export type AuthUserWithPassword = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
};
