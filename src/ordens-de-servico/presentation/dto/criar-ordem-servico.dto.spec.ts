import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CriarOrdemServicoDto } from './criar-ordem-servico.dto';

describe('CriarOrdemServicoDto', () => {
  const baseValid = {
    documentoCliente: '12345678901',
    placa: 'ABC1D23',
    itensServico: [{ servicoId: 1 }],
    itensPeca: [{ estoqueId: 5, quantidade: 2 }],
  };

  it('aceita payload válido', async () => {
    const dto = plainToInstance(CriarOrdemServicoDto, baseValid);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita documentoCliente vazio', async () => {
    const dto = plainToInstance(CriarOrdemServicoDto, {
      ...baseValid,
      documentoCliente: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita placa ausente', async () => {
    const dto = plainToInstance(CriarOrdemServicoDto, {
      ...baseValid,
      placa: undefined,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita itensServico não-array', async () => {
    const dto = plainToInstance(CriarOrdemServicoDto, {
      ...baseValid,
      itensServico: 'not-an-array',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita item de peça com quantidade negativa', async () => {
    const dto = plainToInstance(CriarOrdemServicoDto, {
      ...baseValid,
      itensPeca: [{ estoqueId: 5, quantidade: -1 }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('aceita observação opcional', async () => {
    const dto = plainToInstance(CriarOrdemServicoDto, {
      ...baseValid,
      observacao: 'Cliente reportou ruído',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
