import { Faker, pt_BR } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../../users/user.entity';

const USERS_TO_SEED = 10;
const faker = new Faker({ locale: [pt_BR] });

type SeedUsersResponse = {
  message: string;
  count: number;
  data: UserEntity[];
};

@Injectable()
export class SeedingService {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<SeedUsersResponse> {
    const userRepository: Repository<UserEntity> =
      this.dataSource.getRepository(UserEntity);
    const users = Array.from({ length: USERS_TO_SEED }, () =>
      userRepository.create(this.createFakeUser()),
    );
    const createdUsers = await userRepository.save(users);

    return {
      message: `${createdUsers.length} users seeded successfully`,
      count: createdUsers.length,
      data: createdUsers,
    };
  }

  private createFakeUser(): Pick<UserEntity, 'username' | 'email'> {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const suffix = faker.string.alphanumeric(6).toLowerCase();

    return {
      username: `${faker.internet.userName(firstName, lastName).toLowerCase()}_${suffix}`,
      email: `${this.normalize(firstName)}.${this.normalize(lastName)}.${suffix}@example.com`,
    };
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }
}
