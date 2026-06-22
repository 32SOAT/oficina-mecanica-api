import { SwaggerModule } from '@nestjs/swagger';
import { configureSwagger } from './configure-swagger';

jest.mock('@nestjs/swagger', () => {
  const actual = jest.requireActual('@nestjs/swagger');
  return {
    ...actual,
    SwaggerModule: {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    },
  };
});

describe('configureSwagger', () => {
  it('sets up swagger document', () => {
    const app = {} as never;

    configureSwagger(app);

    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api', app, {});
  });
});
