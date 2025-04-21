import { Test, TestingModule } from '@nestjs/testing';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from '../services/itinerary.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { StopType } from '../../../common/enums';
import { TripTimeline } from '../../interfaces/itinerary';

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

  const mockTimeline: TripTimeline = {
    trip_id: 1,
    title: 'Test Trip',
    description: 'Test Description',
    start_date: new Date('2025-05-01'),
    end_date: new Date('2025-05-10'),
    total_distance: 500,
    total_duration: 600,
    stints: [
      {
        stint_id: 1,
        name: 'Test Stint',
        sequence_number: 1,
        distance: 100,
        estimated_duration: 120,
        timeline: [],
      },
    ],
  };

  beforeEach(async () => {
    const mockItineraryService = {
      getTripTimeline: jest.fn(),
      addStop: jest.fn(),
      removeStop: jest.fn(),
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
    service = module.get(ItineraryService) as jest.Mocked<ItineraryService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTripTimeline', () => {
    it('should return a complete trip timeline', async () => {
      service.getTripTimeline.mockResolvedValue(mockTimeline);

      const result = await controller.getTripTimeline(1, mockUser);

      expect(service.getTripTimeline).toHaveBeenCalledWith(1, mockUser.user_id);
      expect(result).toBe(mockTimeline);
    });

    it('should throw NotFoundException when trip not found', async () => {
      service.getTripTimeline.mockRejectedValue(new NotFoundException());

      await expect(controller.getTripTimeline(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addStop', () => {
    const createStopDto: CreateStopDto = {
      name: 'Golden Gate Park',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '501 Stanyan St, San Francisco, CA 94117',
      stop_type: StopType.ATTRACTION,
      arrival_time: new Date('2025-05-15T14:00:00Z'),
      departure_time: new Date('2025-05-15T17:00:00Z'),
      duration: 180,
      sequence_number: 1,
      notes: 'Bring hiking shoes and camera',
      trip_id: 1,
      stint_id: 1,
    };

    const mockStop = {
      stop_id: 1,
      ...createStopDto,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should add a stop successfully', async () => {
      service.addStop.mockResolvedValue(mockStop as any);

      const result = await controller.addStop(createStopDto, mockUser);

      expect(service.addStop).toHaveBeenCalledWith(
        createStopDto,
        mockUser.user_id,
      );
      expect(result).toBe(mockStop);
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      service.addStop.mockRejectedValue(new ForbiddenException());

      await expect(controller.addStop(createStopDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('removeStop', () => {
    it('should remove a stop successfully', async () => {
      service.removeStop.mockResolvedValue(undefined);

      await controller.removeStop(1, mockUser);

      expect(service.removeStop).toHaveBeenCalledWith(1, mockUser.user_id);
    });

    it('should throw NotFoundException when stop not found', async () => {
      service.removeStop.mockRejectedValue(new NotFoundException());

      await expect(controller.removeStop(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
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
