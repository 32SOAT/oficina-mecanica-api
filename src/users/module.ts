import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { RemoveUserUseCase } from './application/use-cases/remove-user.use-case';
import { UserInfraModule } from './infrastructure/infra.module';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [UserInfraModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    RemoveUserUseCase,
  ],
})
export class UserModule {}
