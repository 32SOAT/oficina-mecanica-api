import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrdemServicoEntity } from '../../ordem-servico.entity';
import { StatusOrdemServico } from '../../state-machine/status-ordem-servico.enum';
import { StatusAlteradoEvent } from '../ordem-servico.events';
import { NotificarListener } from './notificar.listener';

describe('NotificarListener', () => {
  let osRepo: jest.Mocked<Pick<Repository<OrdemServicoEntity>, 'findOne'>>;
  let listener: NotificarListener;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    osRepo = { findOne: jest.fn() };
    listener = new NotificarListener(
      osRepo as unknown as Repository<OrdemServicoEntity>,
    );
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('AGUARDANDO_APROVACAO: loga notificação ao cliente com nome, email, placa e valor', async () => {
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

    expect(logSpy).toHaveBeenCalledTimes(1);
    const message = logSpy.mock.calls[0][0] as string;
    expect(message).toContain('CLIENTE');
    expect(message).toContain('os-1');
    expect(message).toContain('ABC1D23');
    expect(message).toContain('João');
    expect(message).toContain('joao@example.com');
    expect(message).toContain('850.00');
  });

  it('RECEBIDA: loga notificação aos mecânicos', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      veiculo: { placa: 'XYZ9A99' },
    } as OrdemServicoEntity);

    await listener.handle(
      new StatusAlteradoEvent('os-1', null, StatusOrdemServico.Recebida, null),
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0] as string).toContain('MECÂNICOS');
    expect(logSpy.mock.calls[0][0] as string).toContain('RECEBIDA');
  });

  it('AGUARDANDO_SERVICO: loga notificação aos mecânicos', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      veiculo: { placa: 'DEF4G56' },
    } as OrdemServicoEntity);

    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.Aprovada,
        StatusOrdemServico.AguardandoServico,
        null,
      ),
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0] as string).toContain('AGUARDANDO_SERVICO');
  });

  it('AGUARDANDO_PECAS_INSUMOS: loga notificação ao administrador', async () => {
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

    expect(logSpy).toHaveBeenCalledTimes(1);
    const message = logSpy.mock.calls[0][0] as string;
    expect(message).toContain('ADMINISTRADOR');
    expect(message).toContain('encomenda');
  });

  it('FINALIZADA: loga ao cliente sobre retirada do veículo', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      cliente: { nome: 'Maria', email: 'maria@example.com' },
      veiculo: { placa: 'LMN3O45' },
    } as OrdemServicoEntity);

    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.EmExecucao,
        StatusOrdemServico.Finalizada,
        null,
      ),
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    const message = logSpy.mock.calls[0][0] as string;
    expect(message).toContain('finalizado');
    expect(message).toContain('retirado');
    expect(message).toContain('Maria');
  });

  it('status sem notificação dedicada não loga', async () => {
    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        StatusOrdemServico.Recebida,
        StatusOrdemServico.EmDiagnostico,
        null,
      ),
    );
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
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
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
