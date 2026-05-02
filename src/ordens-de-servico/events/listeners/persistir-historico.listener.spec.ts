import { Repository } from 'typeorm';
import { HistoricoStatusOsEntity } from '../../entities/historico-status-os.entity';
import { StatusOrdemServico as S } from '../../state-machine/status-ordem-servico.enum';
import { StatusAlteradoEvent } from '../ordem-servico.events';
import { PersistirHistoricoListener } from './persistir-historico.listener';

describe('PersistirHistoricoListener', () => {
  let repo: jest.Mocked<
    Pick<Repository<HistoricoStatusOsEntity>, 'create' | 'save'>
  >;
  let listener: PersistirHistoricoListener;

  beforeEach(() => {
    repo = {
      create: jest.fn((data: unknown) => data) as unknown as jest.Mocked<
        Repository<HistoricoStatusOsEntity>
      >['create'],
      save: jest.fn(async (x: unknown) => x) as unknown as jest.Mocked<
        Repository<HistoricoStatusOsEntity>
      >['save'],
    };
    listener = new PersistirHistoricoListener(
      repo as unknown as Repository<HistoricoStatusOsEntity>,
    );
  });

  it('grava status_anterior, status_novo e os_id corretos', async () => {
    await listener.handle(
      new StatusAlteradoEvent('os-1', S.EmDiagnostico, S.AguardandoAprovacao),
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        os_id: 'os-1',
        statusAnterior: S.EmDiagnostico,
        statusNovo: S.AguardandoAprovacao,
      }),
    );
    expect(repo.save).toHaveBeenCalled();
  });

  it('aceita statusAnterior=null (criação inicial)', async () => {
    await listener.handle(new StatusAlteradoEvent('os-2', null, S.Recebida));
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        statusAnterior: null,
        statusNovo: S.Recebida,
      }),
    );
  });

  it('grava usuarioId como null no MVP (sem auth ainda)', async () => {
    await listener.handle(
      new StatusAlteradoEvent('os-3', S.Aprovada, S.AguardandoServico),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: null }),
    );
  });
});
