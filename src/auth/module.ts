import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { IssueAuthTokenUseCase } from './application/use-cases/issue-auth-token.use-case';
import { ValidateCredentialsUseCase } from './application/use-cases/validate-credentials.use-case';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { AuthInfraModule } from './infrastructure/infra.module';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [AuthInfraModule],
  controllers: [AuthController],
  providers: [
    ValidateCredentialsUseCase,
    IssueAuthTokenUseCase,
    ChangePasswordUseCase,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
