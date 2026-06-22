import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfig } from '../../config/env/jwt.config';
import { UserInfraModule } from '../../users/infrastructure/infra.module';
import { PASSWORD_HASHER } from '../application/ports/password-hasher.port';
import { TOKEN_SERVICE } from '../application/ports/token.service.port';
import { BcryptPasswordHasher } from './bcrypt/bcrypt-password.hasher';
import { JwtTokenService } from './jwt/jwt-token.service';

@Module({
  imports: [
    UserInfraModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { secret, expiresIn } =
          configService.getOrThrow<JwtConfig>('jwt');
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  providers: [
    BcryptPasswordHasher,
    JwtTokenService,
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useExisting: JwtTokenService },
  ],
  exports: [PASSWORD_HASHER, TOKEN_SERVICE, JwtModule, UserInfraModule],
})
export class AuthInfraModule {}
