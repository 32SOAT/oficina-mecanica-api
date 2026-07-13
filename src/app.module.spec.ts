describe('AppModule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'test',
      POSTGRES_SYNC: '0',
      JWT_SECRET: 'test-secret',
      RESEND_API_KEY: 're_test_key',
      NOTIFICACAO_EMAIL_MECANICOS: 'mecanicos@example.com',
      NOTIFICACAO_EMAIL_ADMIN: 'admin@example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports module class', () => {
    const { AppModule } = require('./app.module');
    expect(AppModule).toBeDefined();
  });
});
