import { Injectable } from '@nestjs/common';
import { AppConfig } from './config/app.config';
import { TypedConfigService } from './config/typed-config.service';

@Injectable()
export class AppService {
  constructor(private readonly configService: TypedConfigService) {}

  getHello(): string {
    const environment = this.configService.get<AppConfig>('app')?.environment;
    console.log(environment);
    return 'Hello World!';
  }
}
