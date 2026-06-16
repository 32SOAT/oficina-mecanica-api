import { Test, TestingModule } from '@nestjs/testing';
import { ClienteTestModule } from './cliente-test.module';

describe('ClienteModule', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ClienteTestModule],
    }).compile();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('should resolve all dependencies (DI)', () => {
    expect(moduleRef).toBeDefined();

    expect(moduleRef.get('CLIENTE_REPOSITORY')).toBeDefined();
  });
});
