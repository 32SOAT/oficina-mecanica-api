import { OrdemServicoEntity } from './ordem-servico.entity';
import { StatusOrdemServico as S } from './state-machine/status-ordem-servico.enum';
import { TransicaoInvalidaException } from './state-machine/transicao-invalida.exception';
import { ItemOsServicoEntity } from './entities/item-os-servico.entity';
import { ItemOsEstoqueEntity } from './entities/item-os-estoque.entity';

describe('OrdemServicoEntity', () => {
  const novaOs = (status: S = S.Recebida): OrdemServicoEntity => {
    const os = new OrdemServicoEntity();
    os.id = 'os-id';
    os.status = status;
    return os;
  };

  describe('avancarStatus', () => {
    it('avança para um status válido', () => {
      const os = novaOs(S.Recebida);
      const r = os.avancarStatus(S.EmDiagnostico);
      expect(os.status).toBe(S.EmDiagnostico);
      expect(r.anterior).toBe(S.Recebida);
      expect(r.novo).toBe(S.EmDiagnostico);
    });

    it('lança em transição inválida', () => {
      const os = novaOs(S.Recebida);
      expect(() => os.avancarStatus(S.Entregue)).toThrow(
        TransicaoInvalidaException,
      );
    });

    it('preserva o status anterior em caso de erro', () => {
      const os = novaOs(S.Recebida);
      try {
        os.avancarStatus(S.Entregue);
      } catch {
        /* ignore */
      }
      expect(os.status).toBe(S.Recebida);
    });
  });

  describe('calcularValorTotal', () => {
    it('soma serviços e (quantidade × preço) das peças', () => {
      const os = novaOs();
      os.itensServico = [
        Object.assign(new ItemOsServicoEntity(), { precoAplicado: 100 }),
        Object.assign(new ItemOsServicoEntity(), { precoAplicado: 50.5 }),
      ];
      os.itensPeca = [
        Object.assign(new ItemOsEstoqueEntity(), {
          quantidade: 2,
          precoAplicado: 30,
        }),
        Object.assign(new ItemOsEstoqueEntity(), {
          quantidade: 1,
          precoAplicado: 89.9,
        }),
      ];
      expect(os.calcularValorTotal()).toBeCloseTo(300.4, 2);
    });

    it('retorna 0 quando não há itens', () => {
      const os = novaOs();
      os.itensServico = [];
      os.itensPeca = [];
      expect(os.calcularValorTotal()).toBe(0);
    });

    it('lida com listas undefined', () => {
      const os = novaOs();
      expect(os.calcularValorTotal()).toBe(0);
    });
  });

  describe('todasPecasDisponiveis', () => {
    it('true quando todas as peças têm disponivelNoDiagnostico=true', () => {
      const os = novaOs();
      os.itensPeca = [
        Object.assign(new ItemOsEstoqueEntity(), {
          disponivelNoDiagnostico: true,
        }),
        Object.assign(new ItemOsEstoqueEntity(), {
          disponivelNoDiagnostico: true,
        }),
      ];
      expect(os.todasPecasDisponiveis()).toBe(true);
    });

    it('false quando ao menos uma peça está indisponível', () => {
      const os = novaOs();
      os.itensPeca = [
        Object.assign(new ItemOsEstoqueEntity(), {
          disponivelNoDiagnostico: true,
        }),
        Object.assign(new ItemOsEstoqueEntity(), {
          disponivelNoDiagnostico: false,
        }),
      ];
      expect(os.todasPecasDisponiveis()).toBe(false);
    });

    it('true quando não há peças', () => {
      const os = novaOs();
      os.itensPeca = [];
      expect(os.todasPecasDisponiveis()).toBe(true);
    });

    it('true quando itensPeca é undefined', () => {
      const os = novaOs();
      expect(os.todasPecasDisponiveis()).toBe(true);
    });
  });
});
