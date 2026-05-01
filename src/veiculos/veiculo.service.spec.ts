import { HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DefaultPageSize } from '../querying/constants';
import { ClienteService } from '../clientes/cliente.service';
import { UpdateVeiculoDto } from './dtos/update-veiculo.dto';
import { VeiculoEntity } from './veiculo.entity';
import { VeiculoService } from './veiculo.service';

type MockRepository = {
  create: jest.Mock;
  save: jest.Mock;
  findAndCount: jest.Mock;
  findOneBy: jest.Mock;
  merge: jest.Mock;
  softRemove: jest.Mock;
  findOne: jest.Mock;
};

type ClienteServiceMock = {
  findByDocumento: jest.Mock;
};

type PaginationServiceMock = {
  calculateOffset: jest.Mock;
  createMeta: jest.Mock;
};

describe('VeiculoService', () => {
  let service: VeiculoService;
  let veiculoRepository: MockRepository;
  let clienteService: ClienteServiceMock;
  let paginationService: PaginationServiceMock;

  const cliente = {
    id: 'cliente-id',
    documento: '39053344705',
    nome: 'Jane Doe',
    email: 'jane@example.com',
    celularNumero: '11999999999',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const veiculo = {
    id: 'veiculo-id',
    placa: 'ABC1234',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2020,
    cliente_id: cliente.id,
    cliente,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    veiculoRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
      findOne: jest.fn(),
    };

    clienteService = {
      findByDocumento: jest.fn(),
    };

    paginationService = {
      calculateOffset: jest.fn(),
      createMeta: jest.fn(),
    };

    service = new VeiculoService(
      veiculoRepository as unknown as Repository<VeiculoEntity>,
      paginationService,
      clienteService as unknown as ClienteService,
    );
  });

  it('creates a vehicle', async () => {
    const createVeiculoDto = {
      placa: 'ABC1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      documentoCliente: cliente.documento,
    };
    const createdVeiculo = veiculo;
    clienteService.findByDocumento.mockResolvedValue(cliente);
    veiculoRepository.create.mockReturnValue(createdVeiculo);
    veiculoRepository.save.mockResolvedValue(createdVeiculo);

    await expect(service.create(createVeiculoDto)).resolves.toBe(
      createdVeiculo,
    );
    expect(clienteService.findByDocumento).toHaveBeenCalledWith(
      createVeiculoDto.documentoCliente,
    );
    expect(veiculoRepository.create).toHaveBeenCalledWith({
      placa: 'ABC1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      cliente_id: cliente.id,
    });
    expect(veiculoRepository.save).toHaveBeenCalledWith(createdVeiculo);
  });

  it('throws error for invalid plate', async () => {
    const createVeiculoDto = {
      placa: 'INVALID',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      documentoCliente: cliente.documento,
    };
    clienteService.findByDocumento.mockResolvedValue(cliente);

    await expect(service.create(createVeiculoDto)).rejects.toThrow(
      'Placa inválida.',
    );
  });

  it('creates vehicle with Mercosul plate format', async () => {
    const createVeiculoDto = {
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      documentoCliente: cliente.documento,
    };
    const createdVeiculo = { ...veiculo, placa: 'ABC1D23' };
    clienteService.findByDocumento.mockResolvedValue(cliente);
    veiculoRepository.create.mockReturnValue(createdVeiculo);
    veiculoRepository.save.mockResolvedValue(createdVeiculo);

    await expect(service.create(createVeiculoDto)).resolves.toBe(
      createdVeiculo,
    );
    expect(veiculoRepository.create).toHaveBeenCalledWith({
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      cliente_id: cliente.id,
    });
  });

  it('throws error for duplicate plate', async () => {
    const createVeiculoDto = {
      placa: 'ABC1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      documentoCliente: cliente.documento,
    };
    clienteService.findByDocumento.mockResolvedValue(cliente);
    veiculoRepository.findOne.mockResolvedValue(veiculo);

    await expect(service.create(createVeiculoDto)).rejects.toThrow(
      'Placa já cadastrada para outro veículo.',
    );
  });

  it('throws error if client not found', async () => {
    const createVeiculoDto = {
      placa: 'ABC1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      documentoCliente: 'invalid',
    };
    clienteService.findByDocumento.mockRejectedValue(
      new HttpException('Cliente não encontrado.', 404),
    );

    await expect(service.create(createVeiculoDto)).rejects.toThrow(
      'Cliente não encontrado.',
    );
  });

  it('finds all vehicles with pagination', async () => {
    const paginationDto = { page: 1, take: 10 };
    const result = {
      data: [veiculo],
      meta: {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    veiculoRepository.findAndCount.mockResolvedValue([[veiculo], 1]);
    paginationService.calculateOffset.mockReturnValue(0);
    paginationService.createMeta.mockReturnValue(result.meta);

    await expect(service.findAll(paginationDto)).resolves.toEqual(result);
    expect(veiculoRepository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
    });
  });

  it('finds all vehicles with default pagination when query is empty', async () => {
    const result = {
      data: [veiculo],
      meta: {
        itemsPerPage: Number(DefaultPageSize.VEICULO),
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    veiculoRepository.findAndCount.mockResolvedValue([[veiculo], 1]);
    paginationService.calculateOffset.mockReturnValue(0);
    paginationService.createMeta.mockReturnValue(result.meta);

    await expect(service.findAll({})).resolves.toEqual(result);
    expect(paginationService.calculateOffset).toHaveBeenCalledWith(
      Number(DefaultPageSize.VEICULO),
      1,
    );
    expect(veiculoRepository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: Number(DefaultPageSize.VEICULO),
    });
  });

  it('finds vehicle by placa', async () => {
    veiculoRepository.findOne.mockResolvedValue(veiculo);

    await expect(service.findByPlaca(veiculo.placa)).resolves.toBe(veiculo);
    expect(veiculoRepository.findOne).toHaveBeenCalledWith({
      where: { placa: veiculo.placa },
    });
  });

  it('finds one vehicle by id', async () => {
    veiculoRepository.findOneBy.mockResolvedValue(veiculo);

    await expect(service.findOne(veiculo.id)).resolves.toBe(veiculo);
    expect(veiculoRepository.findOneBy).toHaveBeenCalledWith({
      id: veiculo.id,
    });
  });

  it('throws 404 when vehicle not found by id', async () => {
    veiculoRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toThrow(
      'Veiculo não encontrado.',
    );
  });

  it('throws 404 when vehicle not found by placa', async () => {
    veiculoRepository.findOne.mockResolvedValue(null);

    await expect(service.findByPlaca('XYZ9999')).rejects.toThrow(
      'Veiculo não encontrado.',
    );
  });

  it('throws error for invalid plate in findByPlaca', async () => {
    await expect(service.findByPlaca('INVALID')).rejects.toThrow(
      'Placa inválida.',
    );
  });

  it('updates a vehicle', async () => {
    const updateVeiculoDto: UpdateVeiculoDto = {
      marca: 'Honda',
    };
    const updatedVeiculo = { ...veiculo, marca: 'Honda' };
    veiculoRepository.findOneBy.mockResolvedValue(veiculo);
    veiculoRepository.merge.mockReturnValue(updatedVeiculo);
    veiculoRepository.save.mockResolvedValue(updatedVeiculo);

    await expect(service.update(veiculo.id, updateVeiculoDto)).resolves.toBe(
      updatedVeiculo,
    );
    expect(veiculoRepository.findOneBy).toHaveBeenCalledWith({
      id: veiculo.id,
    });
    expect(veiculoRepository.merge).toHaveBeenCalledWith(
      veiculo,
      updateVeiculoDto,
    );
    expect(veiculoRepository.save).toHaveBeenCalledWith(updatedVeiculo);
  });

  it('updates client relationship using documentoCliente', async () => {
    const novoCliente = {
      ...cliente,
      id: 'novo-cliente-id',
      documento: '19463217000128',
    };
    const updateVeiculoDto: UpdateVeiculoDto = {
      documentoCliente: novoCliente.documento,
    };
    const updatedVeiculo = { ...veiculo, cliente_id: novoCliente.id };
    veiculoRepository.findOneBy.mockResolvedValue(veiculo);
    clienteService.findByDocumento.mockResolvedValue(novoCliente as any);
    veiculoRepository.merge.mockReturnValue(updatedVeiculo);
    veiculoRepository.save.mockResolvedValue(updatedVeiculo);

    await expect(service.update(veiculo.id, updateVeiculoDto)).resolves.toBe(
      updatedVeiculo,
    );
    expect(clienteService.findByDocumento).toHaveBeenCalledWith(
      novoCliente.documento,
    );
    expect(veiculoRepository.merge).toHaveBeenCalledWith(veiculo, {});
    expect(veiculoRepository.save).toHaveBeenCalledWith(updatedVeiculo);
    expect(updatedVeiculo.cliente_id).toBe(novoCliente.id);
  });

  it('removes a vehicle', async () => {
    veiculoRepository.findOneBy.mockResolvedValue(veiculo);
    veiculoRepository.softRemove.mockResolvedValue(veiculo);

    await expect(service.remove(veiculo.id)).resolves.toBe(veiculo);
    expect(veiculoRepository.findOneBy).toHaveBeenCalledWith({
      id: veiculo.id,
    });
    expect(veiculoRepository.softRemove).toHaveBeenCalledWith(veiculo);
  });
});
