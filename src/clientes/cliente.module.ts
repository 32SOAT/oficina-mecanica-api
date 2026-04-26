import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryingModule } from '../querying/querying.module';
import { ClienteController } from './cliente.controller';
import { ClienteEntity } from './cliente.entity';
import { ClienteService } from './cliente.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClienteEntity]), QueryingModule],
  controllers: [ClienteController],
  providers: [ClienteService],
})
export class ClienteModule {}
