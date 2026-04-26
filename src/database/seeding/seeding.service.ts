import { Faker, pt_BR } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { fake as fakeCpf } from 'validation-br/dist/cpf';
import { ClienteEntity } from '../../clientes/cliente.entity';
import { UserEntity } from '../../users/user.entity';

const CLIENTES_TO_SEED = 10;
const USERS_TO_SEED = 10;
const faker = new Faker({ locale: [pt_BR] });

export type SeedResponse = {
  message: string;
  users: {
    count: number;
    data: UserEntity[];
  };
  clientes: {
    count: number;
    data: ClienteEntity[];
  };
};

@Injectable()
export class SeedingService {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<SeedResponse> {
    const userRepository: Repository<UserEntity> =
      this.dataSource.getRepository(UserEntity);
    const users = Array.from({ length: USERS_TO_SEED }, () =>
      userRepository.create(this.createFakeUser()),
    );
    const createdUsers = await userRepository.save(users);

    const clienteRepository: Repository<ClienteEntity> =
      this.dataSource.getRepository(ClienteEntity);
    const clientes = Array.from({ length: CLIENTES_TO_SEED }, () =>
      clienteRepository.create(this.createFakeCliente()),
    );
    const createdClientes = await clienteRepository.save(clientes);

    return {
      message: `${createdUsers.length} users and ${createdClientes.length} clients seeded successfully`,
      users: {
        count: createdUsers.length,
        data: createdUsers,
      },
      clientes: {
        count: createdClientes.length,
        data: createdClientes,
      },
    };
  }

  private createFakeCliente(): Pick<
    ClienteEntity,
    'documento' | 'nome' | 'email' | 'celularNumero'
  > {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const suffix = faker.string.alphanumeric(4).toLowerCase();

    return {
      documento: fakeCpf(false),
      nome: `${firstName} ${lastName}`,
      email: `${this.normalize(firstName)}.${this.normalize(lastName)}.${suffix}@example.com`,
      celularNumero: `11${faker.string.numeric(9)}`,
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
