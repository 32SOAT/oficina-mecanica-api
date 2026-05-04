import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrdemServicoEntity } from '../../ordem-servico.entity';
import { OrcamentoGeradoEvent } from '../ordem-servico.events';
import { NotificarClienteListener } from './notificar-cliente.listener';

describe('NotificarClienteListener', () => {
  let osRepo: jest.Mocked<Pick<Repository<OrdemServicoEntity>, 'findOne'>>;
  let listener: NotificarClienteListener;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    osRepo = { findOne: jest.fn() };
    listener = new NotificarClienteListener(
      osRepo as unknown as Repository<OrdemServicoEntity>,
    );
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('loga notificação com nome, email, placa e valor', async () => {
    osRepo.findOne.mockResolvedValue({
      id: 'os-1',
      valorTotal: 850,
      cliente: { nome: 'João', email: 'joao@example.com' },
      veiculo: { placa: 'ABC1D23' },
    } as OrdemServicoEntity);

    await listener.handle(new OrcamentoGeradoEvent('os-1'));

    expect(logSpy).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const message = logSpy.mock.calls[0][0] as string;
    expect(message).toContain('os-1');
    expect(message).toContain('ABC1D23');
    expect(message).toContain('João');
    expect(message).toContain('joao@example.com');
    expect(message).toContain('850.00');
  });

  it('loga warning quando OS não existe', async () => {
    osRepo.findOne.mockResolvedValue(null);
    await listener.handle(new OrcamentoGeradoEvent('os-x'));
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
