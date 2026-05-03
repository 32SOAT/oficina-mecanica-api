import { Faker, pt_BR } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { fake as fakeCpf } from 'validation-br/dist/cpf';
import { ClienteEntity } from '../../clientes/cliente.entity';
import { ServicoEntity } from '../../servicos/servico.entity';
import { EstoqueEntity } from '../../estoque/estoque.entity';
import { UserEntity } from '../../users/user.entity';

const BCRYPT_ROUNDS = 10;
const SEEDED_USER_PLAIN_PASSWORD = 'SeedPassword123!';

const CLIENTES_TO_SEED = 5;
const ESTOQUE_TO_SEED = 5;
const USUARIOS_TO_SEED = 5;
const faker = new Faker({ locale: [pt_BR] });
const OFICINA_ITENS_ESTOQUE = [
  'Pastilha de freio dianteira',
  'Disco de freio ventilado',
  'Oleo de motor 5W30',
  'Filtro de oleo',
  'Filtro de ar do motor',
  'Filtro de combustivel',
  'Velas de ignicao',
  'Kit embreagem',
  'Amortecedor dianteiro',
  'Bateria 60Ah',
  'Limpador de bico injetor',
];
const OFICINA_SERVICOS = [
  {
    nome: 'Troca de oleo e filtro',
    descricao: 'Substituicao de oleo e filtro',
  },
  {
    nome: 'Revisao do sistema de freio',
    descricao: 'Inspecao do sistema de freio',
  },
  {
    nome: 'Troca de filtro de ar e combustivel',
    descricao: 'Substituicao de filtros',
  },
  { nome: 'Troca de velas de ignicao', descricao: 'Substituicao de velas' },
  {
    nome: 'Limpeza de sistema de injecao',
    descricao: 'Limpeza de bicos injetores',
  },
];

const MONTADORAS = [
  { marca: 'Toyota', modelos: ['Corolla', 'Yaris', 'Etios', 'Hilux'] },
];

type VeiculoSeedRow = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cliente_id: string;
};

@Injectable()
export class SeedingService {
  constructor(private readonly dataSource: DataSource) {}

  async seed() {
    const stats = {
      clientes: 0,
      veiculos: 0,
      servicos: 0,
      estoque: 0,
      usuarios: 0,
    };

    const userRepository: Repository<UserEntity> =
      this.dataSource.getRepository(UserEntity);
    const passwordHash = await bcrypt.hash(
      SEEDED_USER_PLAIN_PASSWORD,
      BCRYPT_ROUNDS,
    );
    const users = Array.from({ length: USUARIOS_TO_SEED }, () =>
      userRepository.create(this.createFakeUser(passwordHash)),
    );
    const createdUsers = await userRepository.save(users);
    stats.usuarios = createdUsers.length;

    let createdClientes: ClienteEntity[] = [];

    await this.dataSource.transaction(async (manager) => {
      const clienteRepo = manager.getRepository(ClienteEntity);

      const existingClientes = await clienteRepo.find({
        select: { id: true },
      });

      const missingClientes = Math.max(
        0,
        CLIENTES_TO_SEED - existingClientes.length,
      );

      const clientesToCreate = Array.from({ length: missingClientes }).map(() =>
        clienteRepo.create(this.createFakeCliente()),
      );

      const newClientes = await clienteRepo.save(clientesToCreate);

      createdClientes = [...existingClientes, ...newClientes];
      stats.clientes = newClientes.length;

      const servicoRepo = manager.getRepository(ServicoEntity);

      const existingServicos = await servicoRepo.find({
        select: { servico: true },
      });

      const existingNames = new Set(
        existingServicos.map((s) => s.servico).filter(Boolean),
      );

      const servicosToCreate = OFICINA_SERVICOS.filter(
        (s) => !existingNames.has(s.nome),
      ).map((s) =>
        servicoRepo.create({
          servico: s.nome,
          descricao: s.descricao,
          precoMaoDeObra: Number(
            faker.commerce.price({ min: 90, max: 780, dec: 2 }),
          ),
        }),
      );

      const newServicos = await servicoRepo.save(servicosToCreate);
      stats.servicos = newServicos.length;

      const estoqueRepo = manager.getRepository(EstoqueEntity);

      const existingEstoque = await estoqueRepo.find({
        select: { pecasInsumos: true },
      });

      const existingStockNames = new Set(
        existingEstoque
          .map((i) => i.pecasInsumos)
          .filter((v): v is string => typeof v === 'string'),
      );

      const estoqueToCreate = OFICINA_ITENS_ESTOQUE.slice(0, ESTOQUE_TO_SEED)
        .filter(Boolean)
        .filter((nome) => !existingStockNames.has(nome))
        .map((nome) =>
          estoqueRepo.create({
            pecasInsumos: nome,
            quantidadeFisica: faker.number.int({ min: 5, max: 50 }),
            quantidadeReservada: faker.number.int({ min: 0, max: 10 }),
            precoUnitario: Number(
              faker.commerce.price({ min: 10, max: 500, dec: 2 }),
            ),
            codigo: `COD-${Math.floor(Math.random() * 999999)}`,
          }),
        );

      if (estoqueToCreate.length > 0) {
        await estoqueRepo.save(estoqueToCreate);
        stats.estoque = estoqueToCreate.length;
      }

      const existingVeiculos = await manager
        .createQueryBuilder()
        .select('v.id', 'id')
        .addSelect('v.cliente_id', 'cliente_id')
        .from('veiculo', 'v')
        .getRawMany<VeiculoSeedRow>();

      const clientesComVeiculo = new Set(
        existingVeiculos.map((v) => v.cliente_id),
      );

      const clientesSemVeiculo = createdClientes.filter(
        (c) => !clientesComVeiculo.has(c.id),
      );

      const veiculosToCreate = clientesSemVeiculo.map((cliente, index) =>
        this.createFakeVeiculo(cliente.id, index),
      );

      if (veiculosToCreate.length > 0) {
        await manager.getRepository('veiculo').save(veiculosToCreate);
        stats.veiculos = veiculosToCreate.length;
      }
    });

    return {
      message: 'Seeding concluído com sucesso',
      users: {
        count: stats.usuarios,
        data: createdUsers,
      },
      clientes: {
        count: stats.clientes,
        data: createdClientes,
      },
      servicos: {
        count: stats.servicos,
      },
      estoque: {
        count: stats.estoque,
      },
      veiculos: {
        count: stats.veiculos,
      },
    };
  }

  private createFakeCliente() {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const suffix = faker.string.alphanumeric(4).toLowerCase();

    return {
      documento: fakeCpf(false),
      nome: `${first} ${last}`,
      email: `${this.normalize(first)}.${this.normalize(last)}.${suffix}@mail.com`,
      celularNumero: `11${faker.string.numeric(9)}`,
    };
  }

  private createFakeVeiculo(clienteId: string, sequence: number) {
    const m = MONTADORAS[sequence % MONTADORAS.length];

    return {
      placa: this.generatePlaca(sequence),
      marca: m.marca,
      modelo: m.modelos[sequence % m.modelos.length],
      ano: faker.number.int({ min: 2008, max: new Date().getFullYear() }),
      cliente_id: clienteId,
    };
  }

  private createFakeUser(
    passwordHash: string,
  ): Pick<UserEntity, 'username' | 'email' | 'password'> {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const suffix = faker.string.alphanumeric(6).toLowerCase();

    return {
      username: `${faker.internet.userName({ firstName, lastName }).toLowerCase()}_${suffix}`,
      email: `${this.normalize(firstName)}.${this.normalize(lastName)}.${suffix}@example.com`,
      password: passwordHash,
    };
  }

  private generatePlaca(sequence: number): string {
    const letters = faker.string.alpha({ length: 3, casing: 'upper' });
    const middle = faker.string.alpha({ length: 1, casing: 'upper' });

    return `${letters}${sequence % 10}${middle}${String(sequence).padStart(3, '0')}`;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }
}
