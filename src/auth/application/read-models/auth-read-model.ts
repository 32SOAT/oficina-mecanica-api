export type AuthenticatedUserReadModel = {
  id: string;
  username: string;
  email: string;
};

export type LoginReadModel = {
  user: AuthenticatedUserReadModel;
  token: string;
};

/** @deprecated Prefer AuthenticatedUserReadModel */
export type AuthenticatedUserOutput = AuthenticatedUserReadModel;

/** @deprecated Prefer LoginReadModel */
export type LoginOutput = LoginReadModel;
