import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { QueryingModule } from 'src/querying/querying.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), QueryingModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
