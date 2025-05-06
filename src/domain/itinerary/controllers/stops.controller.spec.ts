import { Test, TestingModule } from '@nestjs/testing';
import { StopsController } from './stops.controller';
import { StopsService } from '../services/stops.service';
import { ItineraryService } from '../services/itinerary.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { StopType } from '../../../common/enums';
import { Stop } from '../entities/stop.entity';
import { Location } from '../../locations/entities/location.entity';

describe('StopsController', () => {
  let controller: StopsController;
  let stopsService: jest.Mocked<StopsService>;
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

  const mockLocation: Location = {
    location_id: 1,
    name: 'Golden Gate Park',
    latitude: 37.7749,
    longitude: -122.4194,
    address: '501 Stanyan St, San Francisco, CA 94117',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94117',
    country: 'USA',
    external_id: '',
    external_source: '',
    usage_count: 0,
    user_rating: 0,
    rating_count: 0,
    is_verified: false,
    created_at: new Date(),
    updated_at: new Date(),
    created_by_id: null,
    description: null,
    external_category_id: null,
    geom: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749],
    },
  };

  const mockStop: Stop = {
    stop_id: 1,
    name: 'Golden Gate Park',
    latitude: 37.7749,
    longitude: -122.4194,
    stop_type: StopType.ATTRACTION,
    sequence_number: 1,
    trip_id: 1,
    stint_id: 1,
    arrival_time: new Date('2025-05-15T14:00:00Z'),
    departure_time: new Date('2025-05-15T17:00:00Z'),
    duration: 180,
    notes: 'Bring hiking shoes and camera',
    created_at: new Date(),
    updated_at: new Date(),
    location_id: 1,
    location: mockLocation,
  };

  beforeEach(async () => {
    const mockStopsService = {
      findById: jest.fn(),
      findAllByTrip: jest.fn(),
      findAllByStint: jest.fn(),
    };

    const mockItineraryService = {
      addStop: jest.fn(),
      removeStop: jest.fn(),
      reorderStops: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StopsController],
      providers: [
        {
          provide: StopsService,
          useValue: mockStopsService,
        },
        {
          provide: ItineraryService,
          useValue: mockItineraryService,
        },
      ],
    }).compile();

    controller = module.get<StopsController>(StopsController);
    stopsService = module.get(StopsService);
    itineraryService = module.get(ItineraryService);
  });

  describe('addStop', () => {
    const createStopDto: CreateStopDto = {
      name: 'Golden Gate Park',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '501 Stanyan St, San Francisco, CA 94117',
      stop_type: StopType.ATTRACTION,
      duration: 180,
      notes: 'Bring hiking shoes and camera',
      trip_id: 1,
      stint_id: 1,
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94117',
    };

    it('should successfully add a stop', async () => {
      itineraryService.addStop.mockResolvedValue(mockStop);

      const result = await controller.addStop(createStopDto, mockUser);

      expect(itineraryService.addStop).toHaveBeenCalledWith(
        createStopDto,
        mockUser.user_id,
      );
      expect(result).toBe(mockStop);
    });

    it('should throw NotFoundException when stint not found', async () => {
      itineraryService.addStop.mockRejectedValue(
        new NotFoundException('Stint not found'),
      );

      await expect(controller.addStop(createStopDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not have permission', async () => {
      itineraryService.addStop.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to add stops to this trip',
        ),
      );

      await expect(controller.addStop(createStopDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a stop by ID', async () => {
      stopsService.findById.mockResolvedValue(mockStop);

      const result = await controller.findOne(1);

      expect(stopsService.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(mockStop);
    });

    it('should throw NotFoundException when stop not found', async () => {
      stopsService.findById.mockRejectedValue(
        new NotFoundException('Stop not found'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderStops', () => {
    const reorderStopsDto = {
      stopOrder: [
        { stop_id: 1, sequence_number: 3 },
        { stop_id: 2, sequence_number: 1 },
        { stop_id: 3, sequence_number: 2 },
      ],
    };

    it('should successfully reorder stops', async () => {
      itineraryService.reorderStops.mockResolvedValue(undefined);

      await controller.reorderStops(1, reorderStopsDto, mockUser);

      expect(itineraryService.reorderStops).toHaveBeenCalledWith(
        1,
        reorderStopsDto.stopOrder,
        mockUser.user_id,
      );
    });

    it('should throw NotFoundException when stint not found', async () => {
      itineraryService.reorderStops.mockRejectedValue(
        new NotFoundException('Stint not found'),
      );

      await expect(
        controller.reorderStops(999, reorderStopsDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not have permission', async () => {
      itineraryService.reorderStops.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to modify this stint',
        ),
      );

      await expect(
        controller.reorderStops(1, reorderStopsDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeStop', () => {
    it('should successfully remove a stop', async () => {
      itineraryService.removeStop.mockResolvedValue(undefined);

      await controller.removeStop(1, mockUser);

      expect(itineraryService.removeStop).toHaveBeenCalledWith(
        1,
        mockUser.user_id,
      );
    });

    it('should throw NotFoundException when stop not found', async () => {
      itineraryService.removeStop.mockRejectedValue(
        new NotFoundException('Stop not found'),
      );

      await expect(controller.removeStop(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not have permission', async () => {
      itineraryService.removeStop.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to remove this stop',
        ),
      );

      await expect(controller.removeStop(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when trying to remove the only stop', async () => {
      itineraryService.removeStop.mockRejectedValue(
        new ForbiddenException(
          'Cannot remove the only stop in a stint. Delete the entire stint instead.',
        ),
      );

      await expect(controller.removeStop(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
