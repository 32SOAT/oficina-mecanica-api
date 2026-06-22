import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ApplicationExceptionFilter } from '../presentation/filters/application-exception.filter';
import { configureApp } from './configure-app';

describe('configureApp', () => {
  it('configures versioning, prefix, validation pipe and exception filter', () => {
    const disable = jest.fn();
    const app = {
      getHttpAdapter: jest.fn().mockReturnValue({
        getInstance: () => ({ disable }),
      }),
      enableVersioning: jest.fn(),
      setGlobalPrefix: jest.fn(),
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
    };

    configureApp(app as never);

    expect(disable).toHaveBeenCalledWith('x-powered-by');
    expect(app.enableVersioning).toHaveBeenCalledWith({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
    expect(app.useGlobalFilters).toHaveBeenCalledWith(
      expect.any(ApplicationExceptionFilter),
    );
  });
});
