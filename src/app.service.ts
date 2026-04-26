import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
