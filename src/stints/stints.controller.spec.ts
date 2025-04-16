import { Test, TestingModule } from '@nestjs/testing';
import { StintsController } from './stints.controller';

describe('StintsController', () => {
  let controller: StintsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StintsController],
    }).compile();

    controller = module.get<StintsController>(StintsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
