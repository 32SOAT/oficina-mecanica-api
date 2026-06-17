import { AppDataSource } from './data-source';

describe('AppDataSource', () => {
  it('exposes datasource with migrations', () => {
    expect(AppDataSource).toBeDefined();
    expect(AppDataSource.options).toHaveProperty('migrations');
  });
});
