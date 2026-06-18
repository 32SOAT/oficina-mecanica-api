import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
