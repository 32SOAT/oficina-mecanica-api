import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureSwagger(app: INestApplication): void {
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
}
