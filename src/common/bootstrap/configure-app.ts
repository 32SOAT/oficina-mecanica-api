import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ApplicationExceptionFilter } from '../presentation/filters/application-exception.filter';

export function configureApp(app: INestApplication): void {
  const httpApp = app.getHttpAdapter().getInstance() as { disable: (name: string) => void };
  httpApp.disable('x-powered-by');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new ApplicationExceptionFilter());
}
