import { ClienteModule } from './clientes/cliente.module';
import { QueryingModule } from './querying/querying.module';
import { SeedingModule } from './database/seeding/seeding.module';
import { ServicoModule } from './servicos/servico.module';
import { UserModule } from './users/user.module';
import { VeiculoModule } from './veiculos/veiculo.module';

describe('Module declarations', () => {
  it('exports module classes', () => {
    expect(ClienteModule).toBeDefined();
    expect(ServicoModule).toBeDefined();
    expect(UserModule).toBeDefined();
    expect(VeiculoModule).toBeDefined();
    expect(QueryingModule).toBeDefined();
    expect(SeedingModule).toBeDefined();
  });
});
