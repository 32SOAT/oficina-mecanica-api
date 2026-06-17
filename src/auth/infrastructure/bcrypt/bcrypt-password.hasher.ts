import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../application/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }
}
