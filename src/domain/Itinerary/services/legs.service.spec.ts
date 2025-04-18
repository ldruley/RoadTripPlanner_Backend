import { Test, TestingModule } from '@nestjs/testing';
import { LegsService } from './legs.service';

describe('LegsService', () => {
  let service: LegsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegsService],
    }).compile();

    service = module.get<LegsService>(LegsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
