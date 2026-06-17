import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY } from '../application/ports/user.repository';
import { UserTypeormEntity } from './typeorm/entity/user.typeorm.entity';
import { UserTypeormRepository } from './typeorm/repository/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeormEntity])],
  providers: [
    UserTypeormRepository,
    { provide: USER_REPOSITORY, useClass: UserTypeormRepository },
  ],
  exports: [USER_REPOSITORY],
})
export class UserInfraModule {}
