import { HealthModule } from './health/module';
import { ClienteModule } from './clientes/cliente.module';
import { SeedingModule } from './database/seeds/seeding.module';
import { ServicoModule } from './servicos/module';
import { OrdemServicoModule } from './ordens-de-servico/module';
import { EstoqueModule } from './estoque/module';
import { UserModule } from './users/module';
import { VeiculoModule } from './veiculos/module';

describe('Module declarations', () => {
  it('exports module classes', () => {
    expect(HealthModule).toBeDefined();
    expect(ClienteModule).toBeDefined();
    expect(ServicoModule).toBeDefined();
    expect(EstoqueModule).toBeDefined();
    expect(OrdemServicoModule).toBeDefined();
    expect(UserModule).toBeDefined();
    expect(VeiculoModule).toBeDefined();
    expect(SeedingModule).toBeDefined();
  });
});
