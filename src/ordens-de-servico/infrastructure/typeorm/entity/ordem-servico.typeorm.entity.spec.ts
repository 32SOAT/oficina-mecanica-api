import { BadRequestException } from '@nestjs/common';
import { OrdemServicoTypeormEntity as OrdemServicoEntity } from './ordem-servico.typeorm.entity';
import { StatusOrdemServico as S } from '../../../domain/status-ordem-servico.enum';
import { ItemOsServicoEntity } from './item-os-servico.entity';
import { ItemOsEstoqueEntity } from './item-os-estoque.entity';

describe('OrdemServicoTypeormEntity', () => {
  const createOs = (
    overrides: Partial<OrdemServicoEntity> = {},
  ): OrdemServicoEntity => {
    const os = new OrdemServicoEntity();
    Object.assign(os, {
      id: 'os-1',
      status: S.Recebida,
      valorTotal: 0,
      itensServico: [],
      itensPeca: [],
      ...overrides,
    });
    return os;
  };

  it('avancarStatus altera status em transição válida', () => {
    const os = createOs({ status: S.Recebida });
    const { anterior, novo } = os.avancarStatus(S.EmDiagnostico);
    expect(anterior).toBe(S.Recebida);
    expect(novo).toBe(S.EmDiagnostico);
    expect(os.status).toBe(S.EmDiagnostico);
  });

  it('avancarStatus lança BadRequestException em transição inválida', () => {
    const os = createOs({ status: S.Recebida });
    expect(() => os.avancarStatus(S.Entregue)).toThrow(BadRequestException);
  });

  it('calcularValorTotal soma serviços e peças', () => {
    const os = createOs({
      itensServico: [
        Object.assign(new ItemOsServicoEntity(), { precoAplicado: 100 }),
      ],
      itensPeca: [
        Object.assign(new ItemOsEstoqueEntity(), {
          precoAplicado: 50,
          quantidade: 2,
        }),
      ],
    });
    expect(os.calcularValorTotal()).toBe(200);
  });

  it('todasPecasDisponiveis retorna true quando todas marcadas', () => {
    const os = createOs({
      itensPeca: [
        Object.assign(new ItemOsEstoqueEntity(), {
          disponivelNoDiagnostico: true,
        }),
      ],
    });
    expect(os.todasPecasDisponiveis()).toBe(true);
  });
});
