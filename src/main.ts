import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypedConfigService } from './config/typed-config.service';
import { AppConfig } from './config/app.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpApp = app.getHttpAdapter().getInstance() as Express;
  httpApp.disable('x-powered-by');

  const configService: TypedConfigService = app.get(ConfigService);
  const port = configService.get<AppConfig>('app')?.port;

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('oficina-mecanica-api')
    .setDescription(
      'API para gerenciamento de oficina mecânica (clientes, veículos, OS, estoque, serviços).',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT retornado por POST /auth/login. No Swagger UI, clique em Authorize e cole apenas o token (o prefixo Bearer é aplicado pela interface).',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(port ?? 3000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
