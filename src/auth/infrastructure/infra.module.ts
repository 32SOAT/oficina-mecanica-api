import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtConfig } from '../../config/env/jwt.config';
import { UserEntity } from '../../users/infrastructure/typeorm/entity/user.typeorm.entity';
import { AUTH_USER_REPOSITORY } from '../application/ports/auth-user.repository';
import { PASSWORD_HASHER } from '../application/ports/password-hasher.port';
import { TOKEN_SERVICE } from '../application/ports/token.service.port';
import { BcryptPasswordHasher } from './bcrypt/bcrypt-password.hasher';
import { JwtTokenService } from './jwt/jwt-token.service';
import { AuthUserTypeormRepository } from './typeorm/repository/auth-user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
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
    AuthUserTypeormRepository,
    BcryptPasswordHasher,
    JwtTokenService,
    { provide: AUTH_USER_REPOSITORY, useClass: AuthUserTypeormRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [
    AUTH_USER_REPOSITORY,
    PASSWORD_HASHER,
    TOKEN_SERVICE,
    JwtModule,
  ],
})
export class AuthInfraModule {}
