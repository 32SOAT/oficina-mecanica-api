export type CreateUserInput = {
  username: string;
  email: string;
};

export type UpdateUserInput = {
  username?: string;
  email?: string;
};

export type FindAllUsersInput = {
  page?: number;
  take?: number;
};

export type UserOutput = {
  id: string;
  username: string;
  email: string;
};
