describe('main bootstrap', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('bootstraps app with global settings', async () => {
    const appMock = {
      get: jest
        .fn()
        .mockReturnValue({ get: jest.fn().mockReturnValue({ port: 3333 }) }),
      getHttpAdapter: jest.fn(),
      useGlobalPipes: jest.fn(),
      enableVersioning: jest.fn(),
      setGlobalPrefix: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    const configureApp = jest.fn();
    const configureSwagger = jest.fn();
    const create = jest.fn().mockResolvedValue(appMock);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: { create },
    }));
    jest.doMock('./app.module', () => ({
      AppModule: class AppModule {},
    }));
    jest.doMock('./common/bootstrap/configure-app', () => ({
      configureApp,
    }));
    jest.doMock('./common/bootstrap/configure-swagger', () => ({
      configureSwagger,
    }));

    jest.isolateModules(() => {
      jest.requireActual('./main');
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(create).toHaveBeenCalled();
    expect(configureApp).toHaveBeenCalledWith(appMock);
    expect(configureSwagger).toHaveBeenCalledWith(appMock);
    expect(appMock.listen).toHaveBeenCalledWith(3333);
  });

  it('uses default port when config is undefined', async () => {
    const appMock = {
      get: jest.fn().mockReturnValue({ get: jest.fn().mockReturnValue(undefined) }),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    const create = jest.fn().mockResolvedValue(appMock);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: { create },
    }));
    jest.doMock('./app.module', () => ({
      AppModule: class AppModule {},
    }));
    jest.doMock('./common/bootstrap/configure-app', () => ({
      configureApp: jest.fn(),
    }));
    jest.doMock('./common/bootstrap/configure-swagger', () => ({
      configureSwagger: jest.fn(),
    }));

    jest.isolateModules(() => {
      jest.requireActual('./main');
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(appMock.listen).toHaveBeenCalledWith(3000);
  });

  it('logs and exits on bootstrap error', async () => {
    const error = new Error('boom');
    const create = jest.fn().mockRejectedValue(error);
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: { create },
    }));
    jest.doMock('./app.module', () => ({
      AppModule: class AppModule {},
    }));
    jest.doMock('./common/bootstrap/configure-app', () => ({
      configureApp: jest.fn(),
    }));
    jest.doMock('./common/bootstrap/configure-swagger', () => ({
      configureSwagger: jest.fn(),
    }));

    jest.isolateModules(() => {
      jest.requireActual('./main');
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
