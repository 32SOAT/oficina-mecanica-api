export type AuthenticatedUserReadModel = {
  id: string;
  username: string;
  email: string;
};

export type LoginReadModel = {
  user: AuthenticatedUserReadModel;
  token: string;
};
