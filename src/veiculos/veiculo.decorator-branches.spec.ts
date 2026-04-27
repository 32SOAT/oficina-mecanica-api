describe('Veiculo decorator branch coverage', () => {
  it('loads veiculo modules when Reflect.metadata is unavailable', () => {
    const originalMetadata = (Reflect as any).metadata;

    try {
      (Reflect as any).metadata = undefined;

      jest.isolateModules(() => {
        require('./veiculo.service');
        require('./veiculo.controller');
        require('./veiculo.entity');
      });
    } finally {
      (Reflect as any).metadata = originalMetadata;
    }
  });
});
