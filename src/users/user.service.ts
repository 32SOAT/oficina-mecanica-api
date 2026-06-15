import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserEntity } from './user.entity';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { DefaultPageSize } from '../querying/constants';
import { PaginationService } from '../querying/pagination.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userData = this.userRepository.create(createUserDto);
    return this.userRepository.save(userData);
  }

  async findAll(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const take = paginationDto.take ?? DefaultPageSize.USER;
    const offset = this.paginationService.calculateOffset(take, page);
    const [data, count] = await this.userRepository.findAndCount({
      skip: offset,
      take,
    });
    const meta = this.paginationService.createMeta(take, page, count);
    return {
      data,
      meta,
    };
  }

  async findOne(id: string): Promise<UserEntity> {
    const userData = await this.userRepository.findOneBy({ id });
    if (!userData) {
      throw new HttpException('Usuário não encontrado.', 404);
    }
    return userData;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const existingUser = await this.findOne(id);
    const userData = this.userRepository.merge(existingUser, updateUserDto);
    return await this.userRepository.save(userData);
  }

  async remove(id: string): Promise<UserEntity> {
    const existingUser = await this.findOne(id);
    return await this.userRepository.remove(existingUser);
  }
}
