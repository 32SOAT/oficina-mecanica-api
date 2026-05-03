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
      getHttpAdapter: jest.fn().mockReturnValue({
        getInstance: jest.fn().mockReturnValue({
          disable: jest.fn(),
        }),
      }),
      useGlobalPipes: jest.fn(),
      enableVersioning: jest.fn(),
      setGlobalPrefix: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    const createDocument = jest.fn().mockReturnValue({});
    const setup = jest.fn();
    const create = jest.fn().mockResolvedValue(appMock);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: { create },
    }));
    jest.doMock('./app.module', () => ({
      AppModule: class AppModule {},
    }));
    jest.doMock('@nestjs/swagger', () => {
      class DocumentBuilder {
        setTitle() {
          return this;
        }
        setDescription() {
          return this;
        }
        setVersion() {
          return this;
        }
        addBearerAuth() {
          return this;
        }
        build() {
          return {};
        }
      }
      return {
        DocumentBuilder,
        SwaggerModule: {
          createDocument,
          setup,
        },
      };
    });

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./main');
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(create).toHaveBeenCalled();
    expect(appMock.useGlobalPipes).toHaveBeenCalled();
    expect(appMock.enableVersioning).toHaveBeenCalledWith({
      type: 0,
      defaultVersion: '1',
    });
    expect(appMock.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(appMock.listen).toHaveBeenCalledWith(3333);
    expect(createDocument).toHaveBeenCalled();
    expect(setup).toHaveBeenCalled();
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

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./main');
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
