import { Logger } from '@nestjs/common';
import { CreateOrdemServicoUseCase } from './create-ordem-servico.use-case';
import { OrdemServicoEventsPort } from '../ports/ordem-servico-events.port';
import { OrdemServicoTransactionPort } from '../ports/ordem-servico-transaction.port';
import { OrdemServicoReadModel } from '../read-models/ordem-servico-read-model';

const input = {
  documentoCliente: '52998224725',
  placa: 'ABC1D23',
  itensServico: [{ servicoId: 1 }],
  itensPeca: [],
};

describe('Create OS metrics after transaction', () => {
  const events = {} as OrdemServicoEventsPort;
  const output = { id: 'os-test' } as OrdemServicoReadModel;
  const metrics = { registrarCriacao: jest.fn() };
  beforeEach(() => jest.resetAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('waits for successful transaction completion and increments once', async () => {
    let complete!: (value: OrdemServicoReadModel) => void;
    const committed = new Promise<OrdemServicoReadModel>((resolve) => {
      complete = resolve;
    });
    const transaction = {
      runInTransaction: jest.fn().mockReturnValue(committed),
    } as OrdemServicoTransactionPort;
    const result = new CreateOrdemServicoUseCase(
      transaction,
      events,
      metrics,
    ).execute(input);
    await Promise.resolve();
    expect(metrics.registrarCriacao).not.toHaveBeenCalled();
    complete(output);
    await expect(result).resolves.toBe(output);
    expect(metrics.registrarCriacao).toHaveBeenCalledTimes(1);
    expect(metrics.registrarCriacao).toHaveBeenCalledWith();
  });

  it('does not emit when transaction rejects, including a commit failure', async () => {
    const error = new Error('rollback');
    const transaction = {
      runInTransaction: jest.fn().mockRejectedValue(error),
    } as OrdemServicoTransactionPort;
    await expect(
      new CreateOrdemServicoUseCase(transaction, events, metrics).execute(
        input,
      ),
    ).rejects.toBe(error);
    expect(metrics.registrarCriacao).not.toHaveBeenCalled();
  });

  it('returns the created OS when telemetry throws, without logging sensitive values', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    metrics.registrarCriacao.mockImplementation(() => {
      throw new Error('secret document');
    });
    const transaction = {
      runInTransaction: jest.fn().mockResolvedValue(output),
    } as OrdemServicoTransactionPort;
    await expect(
      new CreateOrdemServicoUseCase(transaction, events, metrics).execute(
        input,
      ),
    ).resolves.toBe(output);
    expect(warn).toHaveBeenCalledWith(
      'Falha ao emitir métrica de criação de OS.',
    );
  });
});
