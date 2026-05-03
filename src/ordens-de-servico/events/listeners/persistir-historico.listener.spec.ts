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
      save: jest.fn((x: unknown) =>
        Promise.resolve(x),
      ) as unknown as jest.Mocked<Repository<HistoricoStatusOsEntity>>['save'],
    };
    listener = new PersistirHistoricoListener(
      repo as unknown as Repository<HistoricoStatusOsEntity>,
    );
  });

  it('grava status_anterior, status_novo e os_id corretos', async () => {
    await listener.handle(
      new StatusAlteradoEvent(
        'os-1',
        S.EmDiagnostico,
        S.AguardandoAprovacao,
        null,
      ),
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
    await listener.handle(
      new StatusAlteradoEvent('os-2', null, S.Recebida, null),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        statusAnterior: null,
        statusNovo: S.Recebida,
      }),
    );
  });

  it('grava usuarioId vindo do evento quando fornecido', async () => {
    await listener.handle(
      new StatusAlteradoEvent(
        'os-3',
        S.Aprovada,
        S.AguardandoServico,
        'usuario-uuid-123',
      ),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 'usuario-uuid-123' }),
    );
  });

  it('grava usuarioId null quando evento não tem usuário', async () => {
    await listener.handle(
      new StatusAlteradoEvent('os-4', null, S.Recebida, null),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: null }),
    );
  });
});
