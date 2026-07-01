import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ClienteLookupPort } from '../../../../clientes/application/ports/cliente-lookup.port';
import { NotificacaoPort } from '../../../../notificacoes/application/ports/notificacao.port';
import { VeiculoLookupPort } from '../../../../veiculos/application/ports/veiculo-lookup.port';
import { StatusOrdemServico } from '../../../domain/status-ordem-servico.enum';
import { OrdemServicoTypeormEntity as OrdemServicoEntity } from '../../typeorm/entity/ordem-servico.typeorm.entity';
import { StatusAlteradoEvent } from '../ordem-servico.events';
import { NotificarListener } from './notificar.listener';

describe('NotificarListener', () => {
  let osRepo: jest.Mocked<Pick<Repository<OrdemServicoEntity>, 'findOne'>>;
  let clienteLookup: jest.Mocked<Pick<ClienteLookupPort, 'findSnapshotById'>>;
  let veiculoLookup: jest.Mocked<Pick<VeiculoLookupPort, 'findSnapshotById'>>;
  let notificacaoPort: jest.Mocked<Pick<NotificacaoPort, 'enviarEmail'>>;
  let listener: NotificarListener;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const configService = {
    getOrThrow: jest.fn().mockReturnValue({
      emailMecanicos: 'mecanicos@oficina.com',
      emailAdmin: 'admin@oficina.com',
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    osRepo = { findOne: jest.fn() };
    clienteLookup = { findSnapshotById: jest.fn().mockResolvedValue(null) };
    veiculoLookup = { findSnapshotById: jest.fn().mockResolvedValue(null) };
    notificacaoPort = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
    listener = new NotificarListener(
      osRepo as unknown as Repository<OrdemServicoEntity>,
      clienteLookup as never,
      veiculoLookup as never,
      notificacaoPort as never,
      configService,
    );
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('AGUARDANDO_APROVACAO: envia e-mail ao cliente', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      valorTotal: 850,
      cliente: { nome: 'João', email: 'joao@example.com' },
      veiculo: { placa: 'ABC1D23' },
    } as OrdemServicoEntity);

    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.EmDiagnostico,
        StatusOrdemServico.AguardandoAprovacao,
        null,
      ),
    );

    expect(notificacaoPort.enviarEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joao@example.com',
        subject: expect.stringContaining('os-1'),
        text: expect.stringContaining('850.00'),
        html: expect.stringContaining('ABC1D23'),
      }),
    );
  });

  it('RECEBIDA: envia e-mail aos mecânicos', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      veiculo: { placa: 'XYZ9A99' },
    } as OrdemServicoEntity);

    await listener.handle(
      new StatusAlteradoEvent('os-1', null, StatusOrdemServico.Recebida, null),
    );

    expect(notificacaoPort.enviarEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mecanicos@oficina.com',
        text: expect.stringContaining('XYZ9A99'),
      }),
    );
  });

  it('AGUARDANDO_PECAS_INSUMOS: envia e-mail ao administrador', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      veiculo: { placa: 'HIJ7K89' },
    } as OrdemServicoEntity);

    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.Aprovada,
        StatusOrdemServico.AguardandoPecasInsumos,
        null,
      ),
    );

    expect(notificacaoPort.enviarEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@oficina.com',
        text: expect.stringContaining('encomenda'),
      }),
    );
  });

  it('status sem notificação dedicada não envia e-mail', async () => {
    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.Recebida,
        StatusOrdemServico.EmDiagnostico,
        null,
      ),
    );
    expect(notificacaoPort.enviarEmail).not.toHaveBeenCalled();
  });

  it('loga warning quando OS não existe', async () => {
    osRepo.findOne.mockResolvedValue(null);

    await listener.handle(
      new StatusAlteradoEvent(
        'os-x',
        null,
        StatusOrdemServico.AguardandoAprovacao,
        null,
      ),
    );

    expect(warnSpy).toHaveBeenCalled();
    expect(notificacaoPort.enviarEmail).not.toHaveBeenCalled();
  });

  it('resolve placa via lookup quando veículo soft-deleted não vem na relação', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      veiculo_id: 'vei-1',
      valorTotal: 500,
      cliente_id: 'cli-1',
      cliente: { nome: 'João', email: 'joao@example.com' },
      veiculo: null,
    } as unknown as OrdemServicoEntity);
    veiculoLookup.findSnapshotById.mockResolvedValue({
      id: 'vei-1',
      placa: 'ABC1D23',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2020,
      cliente_id: 'cli-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    });

    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.EmDiagnostico,
        StatusOrdemServico.AguardandoAprovacao,
        null,
      ),
    );

    expect(notificacaoPort.enviarEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('ABC1D23'),
      }),
    );
  });

  it('não envia e-mail quando endereço do cliente é inválido', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      veiculo_id: 'vei-1',
      valorTotal: 500,
      cliente_id: 'cli-1',
      cliente: null,
      veiculo: { placa: 'ABC1D23' },
    } as unknown as OrdemServicoEntity);

    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.EmDiagnostico,
        StatusOrdemServico.AguardandoAprovacao,
        null,
      ),
    );

    expect(notificacaoPort.enviarEmail).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('loga erro quando envio de e-mail falha', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      valorTotal: 850,
      cliente: { nome: 'João', email: 'joao@example.com' },
      veiculo: { placa: 'ABC1D23' },
    } as OrdemServicoEntity);
    notificacaoPort.enviarEmail.mockRejectedValue(new Error('Resend error'));

    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.EmDiagnostico,
        StatusOrdemServico.AguardandoAprovacao,
        null,
      ),
    );

    expect(errorSpy).toHaveBeenCalled();
  });
});
