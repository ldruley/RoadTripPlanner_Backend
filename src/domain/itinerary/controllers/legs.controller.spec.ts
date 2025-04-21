import { Test, TestingModule } from '@nestjs/testing';
import { LegsController } from './legs.controller';
import { LegsService } from '../services/legs.service';
import { NotFoundException } from '@nestjs/common';
import { Leg, RouteType } from '../entities/leg.entity';

describe('LegsController', () => {
  let controller: LegsController;
  let service: jest.Mocked<LegsService>;

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
    const mockLegsService = {
      findOne: jest.fn(),
      findAllByStint: jest.fn(),
      findLegBetweenStops: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegsController],
      providers: [
        {
          provide: LegsService,
          useValue: mockLegsService,
        },
      ],
    }).compile();

    controller = module.get<LegsController>(LegsController);
    service = module.get(LegsService) as jest.Mocked<LegsService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a leg by ID', async () => {
      service.findOne.mockResolvedValue(mockLeg);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockLeg);
    });

    it('should throw NotFoundException when leg not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStint', () => {
    it('should return all legs for a stint', async () => {
      const legs = [mockLeg];
      service.findAllByStint.mockResolvedValue(legs);

      const result = await controller.findByStint(1);

      expect(service.findAllByStint).toHaveBeenCalledWith(1);
      expect(result).toBe(legs);
    });

    it('should throw NotFoundException when no legs found', async () => {
      service.findAllByStint.mockRejectedValue(new NotFoundException());

      await expect(controller.findByStint(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBetweenStops', () => {
    it('should return a leg between two stops', async () => {
      service.findLegBetweenStops.mockResolvedValue(mockLeg);

      const result = await controller.findBetweenStops(1, 2);

      expect(service.findLegBetweenStops).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(mockLeg);
    });

    it('should return null when no leg exists between stops', async () => {
      service.findLegBetweenStops.mockResolvedValue(null);

      const result = await controller.findBetweenStops(1, 3);

      expect(service.findLegBetweenStops).toHaveBeenCalledWith(1, 3);
      expect(result).toBeNull();
    });
  });
});
