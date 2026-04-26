import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: jest.Mocked<Pick<AppService, 'check'>>;

  beforeEach(async () => {
    const fixedTimestamp = '2023-10-01T12:00:00.000Z';
    appService = {
      check: jest.fn().mockReturnValue({
        status: 'ok',
        timestamp: fixedTimestamp,
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
      const result = appController.check();
      expect(result).toEqual({
        status: 'ok',
        timestamp: '2023-10-01T12:00:00.000Z',
      });
      expect(appService.check).toHaveBeenCalledTimes(1);
    });
  });
});
