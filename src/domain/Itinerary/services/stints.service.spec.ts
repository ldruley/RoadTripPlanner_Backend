import { Test, TestingModule } from '@nestjs/testing';
import { StintsService } from './stints.service';

describe('StintsService', () => {
  let service: StintsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StintsService],
    }).compile();

    service = module.get<StintsService>(StintsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
