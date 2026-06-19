import { Injectable } from '@nestjs/common';
import {
  comparePassword,
  hashPassword,
} from '../../../common/security/password-hash';
import { PasswordHasher } from '../../application/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  compare(plain: string, hash: string): Promise<boolean> {
    return comparePassword(plain, hash);
  }

  hash(plain: string): Promise<string> {
    return hashPassword(plain);
  }
}
