import { TokenPayload } from '../dto/auth.dto';

export const TOKEN_SERVICE = 'TOKEN_SERVICE';

export abstract class TokenService {
  abstract sign(payload: TokenPayload): string;
}
