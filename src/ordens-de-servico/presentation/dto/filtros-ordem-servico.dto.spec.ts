import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FiltrosOrdemServicoDto } from './filtros-ordem-servico.dto';
import { StatusOrdemServico } from '../../domain/status-ordem-servico.enum';

describe('FiltrosOrdemServicoDto', () => {
  it('aceita filtros vazios', async () => {
    const dto = plainToInstance(FiltrosOrdemServicoDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('aceita todos filtros válidos', async () => {
    const dto = plainToInstance(FiltrosOrdemServicoDto, {
      page: 1,
      take: 10,
      status: StatusOrdemServico.EmExecucao,
      clienteId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      dataInicio: '2026-01-01',
      dataFim: '2026-12-31',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita status fora do enum', async () => {
    const dto = plainToInstance(FiltrosOrdemServicoDto, {
      status: 'STATUS_INVALIDO',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita clienteId não-UUID', async () => {
    const dto = plainToInstance(FiltrosOrdemServicoDto, {
      clienteId: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita dataInicio fora do formato ISO', async () => {
    const dto = plainToInstance(FiltrosOrdemServicoDto, {
      dataInicio: '01/01/2026',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
