import { Faker, pt_BR } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { fake as fakeCpf } from 'validation-br/dist/cpf';
import { ClienteEntity } from '../../clientes/cliente.entity';
import { ServicoEntity } from '../../servicos/servico.entity';

const CLIENTES_TO_SEED = 5;
const ESTOQUE_TO_SEED = 5;
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
    descricao: 'Substituicao do oleo do motor e filtro de oleo.',
    itensRelacionados: ['Oleo de motor 5W30', 'Filtro de oleo'],
  },
  {
    nome: 'Revisao do sistema de freio',
    descricao: 'Inspecao e troca de componentes de desgaste do freio.',
    itensRelacionados: ['Pastilha de freio dianteira', 'Disco de freio ventilado'],
  },
  {
    nome: 'Troca de filtro de ar e combustivel',
    descricao: 'Substituicao preventiva de filtros para melhor desempenho.',
    itensRelacionados: ['Filtro de ar do motor', 'Filtro de combustivel'],
  },
  {
    nome: 'Troca de velas de ignicao',
    descricao: 'Substituicao das velas para estabilidade de marcha e partida.',
    itensRelacionados: ['Velas de ignicao'],
  },
  {
    nome: 'Limpeza de sistema de injecao',
    descricao: 'Limpeza de bicos injetores e verificacao de combustao.',
    itensRelacionados: ['Limpador de bico injetor'],
  },
];
const MONTADORAS_MODELOS_COMUNS = [
  { marca: 'Toyota', modelos: ['Corolla', 'Yaris', 'Etios', 'Hilux'] },
];

type EstoqueSeedRow = {
  id: number;
  pecas_insumos: string;
  quantidade_fisica: number;
  quantidade_reservada: number;
  preco_unitario: string;
};

type VeiculoSeedRow = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cliente_id: string;
};

export type SeedResponse = {
  message: string;
  clientes: {
    count: number;
    data: ClienteEntity[];
  };
  veiculos: {
    count: number;
  };
  servicos: {
    count: number;
  };
  estoque: {
    count: number;
  };
};

@Injectable()
export class SeedingService {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<SeedResponse> {
    const seedStats = {
      clientes: 0,
      veiculos: 0,
      servicos: 0,
      estoque: 0,
    };
    let createdClientes: ClienteEntity[] = [];

    await this.dataSource.transaction(async (manager) => {
      const clienteRepository: Repository<ClienteEntity> =
        manager.getRepository(ClienteEntity);
      const existingClientes = await clienteRepository.find({
        select: { id: true },
      });
      const missingClientesCount = Math.max(
        0,
        CLIENTES_TO_SEED - existingClientes.length,
      );
      const clientes = Array.from({ length: missingClientesCount }, () =>
        clienteRepository.create(this.createFakeCliente()),
      );
      const newClientes = await clienteRepository.save(clientes);
      seedStats.clientes = newClientes.length;
      createdClientes = [...existingClientes, ...newClientes];

      const servicoRepository: Repository<ServicoEntity> =
        manager.getRepository(ServicoEntity);
      const existingServicos = await servicoRepository.find({
        select: { servico: true },
      });
      const existingServiceNames = new Set(
        existingServicos.map((servico) => servico.servico),
      );
      const servicosToCreate = OFICINA_SERVICOS.filter(
        (servicoBase) => !existingServiceNames.has(servicoBase.nome),
      ).map((servicoBase) =>
        servicoRepository.create(this.createServicoFromBase(servicoBase)),
      );
      const createdServicos = await servicoRepository.save(servicosToCreate);
      seedStats.servicos = createdServicos.length;

      const estoqueBase = OFICINA_ITENS_ESTOQUE.slice(0, ESTOQUE_TO_SEED);
      const existingEstoque = (await manager
        .createQueryBuilder()
        .select('e.pecas_insumos', 'pecas_insumos')
        .from('estoque', 'e')
        .getRawMany()) as { pecas_insumos: string }[];
      const existingStockNames = new Set(
        existingEstoque.map((item) => item.pecas_insumos),
      );
      const estoqueToCreate = estoqueBase
        .filter((itemNome) => !existingStockNames.has(itemNome))
        .map((itemNome) => this.createFakeEstoque(itemNome));

      if (estoqueToCreate.length === 0) {
        seedStats.estoque = 0;
      } else {
      const createdEstoqueResult = await manager
        .createQueryBuilder()
        .insert()
        .into('estoque', [
          'pecas_insumos',
          'quantidade_fisica',
          'quantidade_reservada',
          'preco_unitario',
        ])
        .values(estoqueToCreate)
        .returning('*')
        .execute();
      const createdEstoque = createdEstoqueResult.raw as EstoqueSeedRow[];
      seedStats.estoque = createdEstoque.length;
      }

      const existingVeiculos = (await manager
        .createQueryBuilder()
        .select('v.id', 'id')
        .addSelect('v.cliente_id', 'cliente_id')
        .from('veiculo', 'v')
        .getRawMany()) as VeiculoSeedRow[];
      const clientesComVeiculo = new Set(
        existingVeiculos.map((veiculo) => veiculo.cliente_id),
      );
      const clientesSemVeiculo = createdClientes.filter(
        (cliente) => !clientesComVeiculo.has(cliente.id),
      );
      const missingVeiculosCount = Math.max(
        0,
        CLIENTES_TO_SEED - existingVeiculos.length,
      );
      const veiculosToCreate = clientesSemVeiculo
        .slice(0, missingVeiculosCount)
        .map((cliente, index) =>
          this.createFakeVeiculo(cliente.id, existingVeiculos.length + index),
        );
      if (veiculosToCreate.length === 0) {
        seedStats.veiculos = 0;
      } else {
        const createdVeiculosResult = await manager
          .createQueryBuilder()
          .insert()
          .into('veiculo')
          .values(veiculosToCreate)
          .returning('*')
          .execute();
        const createdVeiculos = createdVeiculosResult.raw as VeiculoSeedRow[];
        seedStats.veiculos = createdVeiculos.length;
      }
    });

    return {
      message: `Seeding concluido com sucesso para todas as tabelas.`,
      clientes: {
        count: seedStats.clientes,
        data: createdClientes,
      },
      veiculos: {
        count: seedStats.veiculos,
      },
      servicos: {
        count: seedStats.servicos,
      },
      estoque: {
        count: seedStats.estoque,
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

  private createFakeVeiculo(
    clienteId: string,
    sequence: number,
  ): Pick<
    VeiculoSeedRow,
    'placa' | 'marca' | 'modelo' | 'ano' | 'cliente_id'
  > {
    const montadora =
      MONTADORAS_MODELOS_COMUNS[sequence % MONTADORAS_MODELOS_COMUNS.length];
    return {
      placa: this.generateUniquePlaca(sequence),
      marca: montadora.marca,
      modelo:
        montadora.modelos[sequence % montadora.modelos.length] ??
        montadora.modelos[0],
      ano: faker.number.int({ min: 2008, max: new Date().getFullYear() }),
      cliente_id: clienteId,
    };
  }

  private createServicoFromBase(servicoBase: {
    nome: string;
    descricao: string;
    itensRelacionados: string[];
  }): Pick<ServicoEntity, 'servico' | 'descricao' | 'precoMaoDeObra'> {
    return {
      servico: servicoBase.nome,
      descricao: servicoBase.descricao,
      precoMaoDeObra: Number(
        faker.commerce.price({
          min: 90,
          max: 780,
          dec: 2,
        }),
      ),
    };
  }

  private createFakeEstoque(
    nomePecaInsumo: string,
  ): Pick<
    EstoqueSeedRow,
    'pecas_insumos' | 'quantidade_fisica' | 'quantidade_reservada' | 'preco_unitario'
  > {
    const quantidadeFisica = faker.number.int({ min: 5, max: 50 });
    const quantidadeReservada = faker.number.int({
      min: 0,
      max: Math.floor(quantidadeFisica / 2),
    });
    return {
      pecas_insumos: nomePecaInsumo,
      quantidade_fisica: quantidadeFisica,
      quantidade_reservada: quantidadeReservada,
      preco_unitario: faker.commerce.price({
        min: 12,
        max: 420,
        dec: 2,
      }),
    };
  }

  private generateUniquePlaca(sequence: number): string {
    const letters = faker.string.alpha({ length: 3, casing: 'upper' });
    const firstNumber = sequence % 10;
    const middleLetter = faker.string.alpha({ length: 1, casing: 'upper' });
    const lastNumbers = String((100 + sequence) % 1000).padStart(3, '0');
    return `${letters}${firstNumber}${middleLetter}${lastNumbers}`;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }
}
