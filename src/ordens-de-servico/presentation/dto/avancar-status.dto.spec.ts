import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AvancarStatusDto } from './avancar-status.dto';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

describe('AvancarStatusDto', () => {
  it('aceita valor de enum válido', async () => {
    const dto = plainToInstance(AvancarStatusDto, {
      novoStatus: StatusOrdemServico.EmDiagnostico,
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejeita valor fora do enum', async () => {
    const dto = plainToInstance(AvancarStatusDto, { novoStatus: 'NOPE' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejeita valor ausente', async () => {
    const dto = plainToInstance(AvancarStatusDto, {});
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
