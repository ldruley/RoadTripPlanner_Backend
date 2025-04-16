import { Test, TestingModule } from '@nestjs/testing';
import { SuppliesService } from './supplies.service';

describe('SuppliesService', () => {
  let service: SuppliesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuppliesService],
    }).compile();

    service = module.get<SuppliesService>(SuppliesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
