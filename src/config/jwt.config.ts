import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export interface JwtConfig {
  secret: string;
  expiresIn: StringValue;
}

export const jwtConfig = registerAs(
  'jwt',
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET!,
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue,
  }),
);
