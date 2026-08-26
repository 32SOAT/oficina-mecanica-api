import {
  AdminJwtPayload,
  ClienteJwtPayload,
  JwtPayload,
} from './interfaces/authenticated-request.interface';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function parseJwtPayload(raw: unknown): JwtPayload | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const value = raw as Record<string, unknown>;
  if (!isNonEmptyString(value.sub)) {
    return null;
  }

  if (value.role === 'cliente') {
    if (!isNonEmptyString(value.cpf)) {
      return null;
    }

    const payload: ClienteJwtPayload = {
      sub: value.sub,
      role: 'cliente',
      cpf: value.cpf,
    };
    return payload;
  }

  if (value.role !== undefined && value.role !== 'admin') {
    return null;
  }

  if (!isNonEmptyString(value.email) || !isNonEmptyString(value.username)) {
    return null;
  }

  const payload: AdminJwtPayload = {
    sub: value.sub,
    role: 'admin',
    email: value.email,
    username: value.username,
  };
  return payload;
}
