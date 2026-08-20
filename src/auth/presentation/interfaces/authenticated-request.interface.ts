import { Request } from 'express';

export type AuthRole = 'admin' | 'cliente';

export type AdminJwtPayload = {
  sub: string;
  role: 'admin';
  email: string;
  username: string;
};

export type ClienteJwtPayload = {
  sub: string;
  role: 'cliente';
  cpf: string;
};

export type JwtPayload = AdminJwtPayload | ClienteJwtPayload;

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export function isAdminPayload(user: JwtPayload): user is AdminJwtPayload {
  return user.role === 'admin';
}

export function isClientePayload(user: JwtPayload): user is ClienteJwtPayload {
  return user.role === 'cliente';
}
