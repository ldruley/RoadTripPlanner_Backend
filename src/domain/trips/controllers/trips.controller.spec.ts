import { Test, TestingModule } from '@nestjs/testing';
import { TripsController } from '../controllers/trips.controller';
import { TripsService } from '../services/trips.service';
import { ItineraryService } from '../../itinerary/services/itinerary.service';
import { CreateTripDto } from '../dto/create-trip.dto';
import { UpdateTripDto } from '../dto/update-trip-dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Trip } from '../entities/trip.entity';
import { User } from '../../users/entities/user.entity';

describe('TripsController', () => {
  let controller: TripsController;
  let tripsService: jest.Mocked<TripsService>;
  let itineraryService: jest.Mocked<ItineraryService>;

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
    tripParticipants: [],
  };

  const mockTrip: Trip = {
    trip_id: 1,
    title: 'Test Trip',
    description: 'Test Description',
    start_date: new Date('2025-05-01'),
    end_date: new Date('2025-05-10'),
    total_distance: 0,
    is_public: false,
    creator_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    creator: mockUser,
    stints: [],
    participants: [],
    supplies: [],
  };

  const mockTimeline = {
    tripId: 1,
    title: 'Test Trip',
    description: 'Test Description',
    stints: [],
  };

  beforeEach(async () => {
    const mockTripsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByCreator: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockItineraryService = {
      getTripTimeline: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: mockTripsService,
        },
        {
          provide: ItineraryService,
          useValue: mockItineraryService,
        },
      ],
    }).compile();

    controller = module.get<TripsController>(TripsController);
    tripsService = module.get(TripsService);
    itineraryService = module.get(ItineraryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createTripDto: CreateTripDto = {
      title: 'New Trip',
      description: 'New Description',
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-06-10'),
      is_public: false,
    };

    it('should create a new trip successfully', async () => {
      tripsService.create.mockResolvedValue(mockTrip);

      const result = await controller.create(createTripDto, mockUser);

      expect(tripsService.create).toHaveBeenCalledWith({
        ...createTripDto,
        creator_id: mockUser.user_id,
      });
      expect(result).toBe(mockTrip);
    });
  });

  describe('findOne', () => {
    it('should return a trip by ID', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip);

      const result = await controller.findOne(1);

      expect(tripsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockTrip);
    });

    it('should throw NotFoundException when trip not found', async () => {
      tripsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTimeline', () => {
    it('should return trip timeline', async () => {
      itineraryService.getTripTimeline.mockResolvedValue(mockTimeline as any);

      const result = await controller.getTimeline(1, mockUser);

      expect(itineraryService.getTripTimeline).toHaveBeenCalledWith(
        1,
        mockUser.user_id,
      );
      expect(result).toBe(mockTimeline);
    });

    it('should throw NotFoundException when timeline not found', async () => {
      itineraryService.getTripTimeline.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.getTimeline(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByAuthenticatedUser', () => {
    it('should return trips for authenticated user', async () => {
      const trips = [mockTrip];
      tripsService.findByCreator.mockResolvedValue(trips);

      const result = await controller.findByAuthenticatedUser(mockUser);

      expect(tripsService.findByCreator).toHaveBeenCalledWith(mockUser.user_id);
      expect(result).toBe(trips);
    });
  });

  describe('update', () => {
    const updateTripDto: UpdateTripDto = {
      title: 'Updated Trip',
      description: 'Updated Description',
    };

    it('should update a trip successfully', async () => {
      const updatedTrip = { ...mockTrip, ...updateTripDto };
      tripsService.update.mockResolvedValue(updatedTrip);

      const result = await controller.update(1, updateTripDto, mockUser);

      expect(tripsService.update).toHaveBeenCalledWith(
        1,
        updateTripDto,
        mockUser.user_id,
      );
      expect(result).toBe(updatedTrip);
    });

    it('should throw ForbiddenException when user is not creator', async () => {
      tripsService.update.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update(1, updateTripDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a trip successfully', async () => {
      tripsService.remove.mockResolvedValue(undefined);

      await controller.remove(1, mockUser);

      expect(tripsService.remove).toHaveBeenCalledWith(1, mockUser.user_id);
    });

    it('should throw ForbiddenException when user is not creator', async () => {
      tripsService.remove.mockRejectedValue(new ForbiddenException());

      await expect(controller.remove(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
