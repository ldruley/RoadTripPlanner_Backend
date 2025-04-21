import { Test, TestingModule } from '@nestjs/testing';
import { StopsService } from './stops.service';
import { StopsRepository } from '../repositories/stops.repository';
import { TripsService } from '../../trips/trips.service';
import { StintsService } from './stints.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { UpdateStopDto } from '../dto/update-stop.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Stop, StopType } from '../entities/stop.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { Stint } from '../entities/stint.entity';
import { EntityManager } from 'typeorm';

describe('StopsService', () => {
  let service: StopsService;
  let stopsRepository: jest.Mocked<StopsRepository>;
  let tripsService: jest.Mocked<TripsService>;
  let stintsService: jest.Mocked<StintsService>;

  const mockTrip = {
    trip_id: 1,
    creator_id: 1,
    title: 'Test Trip',
  } as Trip;

  const mockStint = {
    stint_id: 1,
    trip_id: 1,
    name: 'Test Stint',
  } as Stint;

  const mockStop: Stop = {
    stop_id: 1,
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
    created_at: new Date(),
    updated_at: new Date(),
    trip: mockTrip,
    stint: mockStint,
  };

  beforeEach(async () => {
    const mockStopsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findAllByTrip: jest.fn(),
      findByStint: jest.fn(),
      remove: jest.fn(),
    };

    const mockTripsService = {
      findOne: jest.fn(),
    };

    const mockStintsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StopsService,
        {
          provide: StopsRepository,
          useValue: mockStopsRepository,
        },
        {
          provide: TripsService,
          useValue: mockTripsService,
        },
        {
          provide: StintsService,
          useValue: mockStintsService,
        },
      ],
    }).compile();

    service = module.get<StopsService>(StopsService);
    stopsRepository = module.get(StopsRepository);
    tripsService = module.get(TripsService);
    stintsService = module.get(StintsService);
  });

  describe('create', () => {
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

    it('should create a stop successfully', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip);
      stintsService.findOne.mockResolvedValue(mockStint);
      stopsRepository.create.mockReturnValue(mockStop);
      stopsRepository.save.mockResolvedValue(mockStop);

      const result = await service.create(createStopDto, 1);

      expect(tripsService.findOne).toHaveBeenCalledWith(1);
      expect(stintsService.findOne).toHaveBeenCalledWith(1);
      expect(stopsRepository.create).toHaveBeenCalledWith(createStopDto);
      expect(stopsRepository.save).toHaveBeenCalledWith(mockStop);
      expect(result).toBe(mockStop);
    });

    it('should throw NotFoundException when trip not found', async () => {
      tripsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(createStopDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not trip creator', async () => {
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as Trip);

      await expect(service.create(createStopDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when stint not found', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip);
      stintsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(createStopDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when stint does not belong to trip', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip);
      stintsService.findOne.mockResolvedValue({
        ...mockStint,
        trip_id: 999,
      } as Stint);

      await expect(service.create(createStopDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createWithTransaction', () => {
    const stopData = {
      name: 'Test Stop',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Test St',
      stop_type: StopType.PITSTOP,
      sequence_number: 1,
      notes: 'Test notes',
      trip_id: 1,
      stint_id: null,
    };

    it('should create a stop within a transaction', async () => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          create: jest.fn().mockReturnValue(mockStop),
          save: jest.fn().mockResolvedValue(mockStop),
        }),
      } as unknown as EntityManager;

      const result = await service.createWithTransaction(stopData, mockManager);

      expect(result).toBe(mockStop);
    });
  });

  describe('findOne', () => {
    it('should return a stop when found', async () => {
      stopsRepository.findById.mockResolvedValue(mockStop);

      const result = await service.findOne(1);

      expect(stopsRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(mockStop);
    });

    it('should throw NotFoundException when stop not found', async () => {
      stopsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByTrip', () => {
    it('should return stops for a trip', async () => {
      const stops = [mockStop];
      stopsRepository.findAllByTrip.mockResolvedValue(stops);

      const result = await service.findAllByTrip(1);

      expect(stopsRepository.findAllByTrip).toHaveBeenCalledWith(1);
      expect(result).toBe(stops);
    });

    it('should throw NotFoundException when no stops found', async () => {
      stopsRepository.findAllByTrip.mockResolvedValue([]);

      await expect(service.findAllByTrip(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByStint', () => {
    it('should return stops for a stint', async () => {
      const stops = [mockStop];
      stopsRepository.findByStint.mockResolvedValue(stops);

      const result = await service.findAllByStint(1);

      expect(stopsRepository.findByStint).toHaveBeenCalledWith(1);
      expect(result).toBe(stops);
    });

    it('should throw NotFoundException when no stops found', async () => {
      stopsRepository.findByStint.mockResolvedValue([]);

      await expect(service.findAllByStint(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateStopDto: UpdateStopDto = {
      name: 'Updated Golden Gate Park',
      notes: 'Updated notes',
    };

    it('should update stop successfully when user is trip creator', async () => {
      const updatedStop = { ...mockStop, ...updateStopDto };
      stopsRepository.findById.mockResolvedValue(mockStop);
      tripsService.findOne.mockResolvedValue(mockTrip);
      stopsRepository.save.mockResolvedValue(updatedStop);

      const result = await service.update(1, updateStopDto, 1);

      expect(result).toEqual(updatedStop);
      expect(stopsRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not trip creator', async () => {
      stopsRepository.findById.mockResolvedValue(mockStop);
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as Trip);

      await expect(service.update(1, updateStopDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should validate new stint when changing stint_id', async () => {
      const updateWithNewStint = { ...updateStopDto, stint_id: 2 };
      stopsRepository.findById.mockResolvedValue(mockStop);
      tripsService.findOne.mockResolvedValue(mockTrip);
      stintsService.findOne.mockResolvedValue({
        ...mockStint,
        stint_id: 2,
        trip_id: 1,
      } as Stint);
      stopsRepository.save.mockResolvedValue(mockStop);

      await service.update(1, updateWithNewStint, 1);

      expect(stintsService.findOne).toHaveBeenCalledWith(2);
    });
  });

  describe('remove', () => {
    it('should remove stop successfully when user is trip creator', async () => {
      stopsRepository.findById.mockResolvedValue(mockStop);
      tripsService.findOne.mockResolvedValue(mockTrip);
      stopsRepository.remove.mockResolvedValue(mockStop);

      await service.remove(1, 1);

      expect(stopsRepository.remove).toHaveBeenCalledWith(mockStop);
    });

    it('should throw ForbiddenException when user is not trip creator', async () => {
      stopsRepository.findById.mockResolvedValue(mockStop);
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as Trip);

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
