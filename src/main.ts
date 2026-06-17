import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ConfigType } from './config/config.module';
import { configureApp } from './common/bootstrap/configure-app';
import { configureSwagger } from './common/bootstrap/configure-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const configService = app.get<ConfigService<ConfigType>>(ConfigService);
  const port = configService.get('app', { infer: true })?.port;

  configureSwagger(app);
  await app.listen(port ?? 3000);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
