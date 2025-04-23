import { Test, TestingModule } from '@nestjs/testing';
import { LegsService } from './legs.service';
import { NotFoundException } from '@nestjs/common';
import { CreateLegDto } from '../dto/create-leg.dto';
import { Leg, RouteType } from '../entities/leg.entity';

describe('LegsService', () => {
  let service: LegsService;
  let repository: jest.Mocked<LegsRepository>;

  const mockLeg: Leg = {
    leg_id: 1,
    stint_id: 1,
    start_stop_id: 1,
    end_stop_id: 2,
    sequence_number: 1,
    distance: 25.5,
    estimated_travel_time: 45,
    route_type: RouteType.HIGHWAY,
    notes: 'Scenic drive along the coast',
    polyline: 'encoded_polyline_string',
    created_at: new Date(),
    updated_at: new Date(),
    stint: null as any,
    start_stop: null as any,
    end_stop: null as any,
  };

  beforeEach(async () => {
    const mockLegsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByStint: jest.fn(),
      findLegBetweenStops: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegsService,
        {
          provide: LegsRepository,
          useValue: mockLegsRepository,
        },
      ],
    }).compile();

    service = module.get<LegsService>(LegsService);
    repository = module.get(LegsRepository);
  });

  describe('create', () => {
    const createLegDto: CreateLegDto = {
      stint_id: 1,
      start_stop_id: 1,
      end_stop_id: 2,
      sequence_number: 1,
      distance: 25.5,
      estimated_travel_time: 45,
      route_type: RouteType.HIGHWAY,
      notes: 'Scenic drive along the coast',
      polyline: 'encoded_polyline_string',
    };

    it('should create a leg successfully', async () => {
      repository.create.mockReturnValue(mockLeg);
      repository.save.mockResolvedValue(mockLeg);

      const result = await service.create(createLegDto);

      expect(repository.create).toHaveBeenCalledWith(createLegDto);
      expect(repository.save).toHaveBeenCalledWith(mockLeg);
      expect(result).toBe(mockLeg);
    });
  });

  describe('findOne', () => {
    it('should return a leg when found', async () => {
      repository.findById.mockResolvedValue(mockLeg);

      const result = await service.findOne(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(mockLeg);
    });

    it('should throw NotFoundException when leg not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByStint', () => {
    it('should return legs for a stint', async () => {
      const legs = [mockLeg];
      repository.findByStint.mockResolvedValue(legs);

      const result = await service.findAllByStint(1);

      expect(repository.findByStint).toHaveBeenCalledWith(1);
      expect(result).toBe(legs);
    });

    it('should throw NotFoundException when no legs found', async () => {
      repository.findByStint.mockResolvedValue([]);

      await expect(service.findAllByStint(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findLegBetweenStops', () => {
    it('should return leg between stops when found', async () => {
      repository.findLegBetweenStops.mockResolvedValue(mockLeg);

      const result = await service.findLegBetweenStops(1, 2);

      expect(repository.findLegBetweenStops).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(mockLeg);
    });

    it('should return null when no leg found between stops', async () => {
      repository.findLegBetweenStops.mockResolvedValue(null);

      const result = await service.findLegBetweenStops(1, 3);

      expect(repository.findLegBetweenStops).toHaveBeenCalledWith(1, 3);
      expect(result).toBeNull();
    });
  });
});
