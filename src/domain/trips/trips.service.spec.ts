import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
import { TripsRepository } from './repository/trips.repository';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Trip } from './entities/trip.entity';
import { UpdateTripDto } from './dto/update-trip-dto';

describe('TripsService', () => {
  let service: TripsService;
  let repository: jest.Mocked<TripsRepository>;

  const mockTrip = {
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
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByCreator: jest.fn(),
      findPublicTrips: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: TripsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    repository = module.get(TripsRepository);
  });

  describe('create', () => {
    const createTripDto = {
      title: 'New Trip',
      description: 'New Description',
      creator_id: 1,
    };

    it('should create a new trip successfully', async () => {
      repository.create.mockReturnValue(mockTrip as Trip);
      repository.save.mockResolvedValue(mockTrip as Trip);

      const result = await service.create(createTripDto);

      expect(repository.create).toHaveBeenCalledWith(createTripDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTrip);
    });
  });

  describe('findOne', () => {
    it('should return a trip when found', async () => {
      repository.findById.mockResolvedValue(mockTrip as Trip);

      const result = await service.findOne(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTrip);
    });

    it('should throw NotFoundException when trip not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCreator', () => {
    it('should return trips for creator', async () => {
      const trips = [mockTrip, { ...mockTrip, trip_id: 2 }];
      repository.findByCreator.mockResolvedValue(trips as Trip[]);

      const result = await service.findByCreator(1);

      expect(repository.findByCreator).toHaveBeenCalledWith(1);
      expect(result).toEqual(trips);
    });

    it('should throw NotFoundException when no trips found for creator', async () => {
      repository.findByCreator.mockResolvedValue([]);

      await expect(service.findByCreator(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateTripDto: Partial<UpdateTripDto> = {
      title: 'Updated Trip',
      description: 'Updated Description',
    };

    it('should update trip successfully when user is creator', async () => {
      const updatedTrip = { ...mockTrip, ...updateTripDto };
      repository.findById.mockResolvedValue(mockTrip as Trip);
      repository.save.mockResolvedValue(updatedTrip as Trip);

      const result = await service.update(1, updateTripDto, 1);

      expect(result).toEqual(updatedTrip);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not creator', async () => {
      repository.findById.mockResolvedValue(mockTrip as Trip);

      await expect(service.update(1, updateTripDto, 999)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove trip successfully when user is creator', async () => {
      repository.findById.mockResolvedValue(mockTrip as Trip);
      repository.remove.mockResolvedValue(mockTrip as Trip);

      await service.remove(1, 1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(mockTrip);
    });

    it('should throw ForbiddenException when user is not creator', async () => {
      repository.findById.mockResolvedValue(mockTrip as Trip);

      await expect(service.remove(1, 999)).rejects.toThrow(ForbiddenException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
