import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_CREDENTIAL_PORT } from '../application/ports/user-credential.port';
import { USER_REPOSITORY } from '../application/ports/user.repository';
import { UserCredentialTypeormAdapter } from './credential/user-credential.typeorm.adapter';
import { UserTypeormEntity } from './typeorm/entity/user.typeorm.entity';
import { UserTypeormRepository } from './typeorm/repository/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeormEntity])],
  providers: [
    UserTypeormRepository,
    UserCredentialTypeormAdapter,
    { provide: USER_REPOSITORY, useExisting: UserTypeormRepository },
    {
      provide: USER_CREDENTIAL_PORT,
      useExisting: UserCredentialTypeormAdapter,
    },
  ],
  exports: [USER_REPOSITORY, USER_CREDENTIAL_PORT],
})
export class UserInfraModule {}
