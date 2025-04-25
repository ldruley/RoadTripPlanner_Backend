import { Test, TestingModule } from '@nestjs/testing';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from '../services/itinerary.service';
import { NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

describe('ItineraryController', () => {
  let controller: ItineraryController;
  let service: jest.Mocked<ItineraryService>;

  const mockUser: User = {
    user_id: 1,
    username: 'testuser',
    fullname: 'Test User',
    email: 'test@example.com',
    password_hash: 'hashedPassword',
    created_at: new Date(),
    updated_at: new Date(),
    created_trips: [],
    owned_vehicles: [],
  };

  beforeEach(async () => {
    const mockItineraryService = {
      updateStintDistance: jest.fn(),
      updateStintDuration: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItineraryController],
      providers: [
        {
          provide: ItineraryService,
          useValue: mockItineraryService,
        },
      ],
    }).compile();

    controller = module.get<ItineraryController>(ItineraryController);
    service = module.get(ItineraryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateStintDistance', () => {
    it('should update stint distance successfully', async () => {
      service.updateStintDistance.mockResolvedValue(undefined);

      await controller.updateStintDistance(1);

      expect(service.updateStintDistance).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when stint not found', async () => {
      service.updateStintDistance.mockRejectedValue(new NotFoundException());

      await expect(controller.updateStintDistance(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStintDuration', () => {
    it('should update stint duration successfully', async () => {
      service.updateStintDuration.mockResolvedValue(undefined);

      await controller.updateStintDuration(1);

      expect(service.updateStintDuration).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when stint not found', async () => {
      service.updateStintDuration.mockRejectedValue(new NotFoundException());

      await expect(controller.updateStintDuration(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
