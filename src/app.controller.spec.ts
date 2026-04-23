import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: jest.Mocked<Pick<AppService, 'check'>>;

  beforeEach(async () => {
    appService = {
      check: jest.fn().mockReturnValue({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the health check result', () => {
      expect(appController.check()).toEqual({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
      expect(appService.check).toHaveBeenCalledTimes(1);
    });
  });
});
