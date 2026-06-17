import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../../application/dto/auth.dto';
import { TokenService } from '../../application/ports/token.service.port';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: TokenPayload): string {
    return this.jwtService.sign(payload);
  }
}
