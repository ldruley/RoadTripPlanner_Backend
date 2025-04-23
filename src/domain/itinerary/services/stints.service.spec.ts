import { Test, TestingModule } from '@nestjs/testing';
import { StintsService } from './stints.service';
import { StintsRepository } from '../repositories/stints.repository';
import { TripsService } from '../../trips/trips.service';
import { StopsService } from './stops.service';
import { DataSource } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateStintDto } from '../dto/create-stint-dto';
import { CreateStintWithStopDto } from '../dto/create-stint-with-stop.dto';
import { StopType } from '../../../common/enums';
import { Stint } from '../entities/stint.entity';
import { Stop } from '../entities/stop.entity';
import { Trip } from '../../trips/entities/trip.entity';

describe('StintsService', () => {
  let service: StintsService;
  let stintsRepository: jest.Mocked<StintsRepository>;
  let tripsService: jest.Mocked<TripsService>;
  let stopsService: jest.Mocked<StopsService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockTrip = {
    trip_id: 1,
    creator_id: 1,
    title: 'Test Trip',
  } as Trip;

  const mockStint = {
    stint_id: 1,
    trip_id: 1,
    name: 'Test Stint',
    sequence_number: 1,
    trip: mockTrip,
  } as Stint;

  const mockStop = {
    stop_id: 1,
    stint_id: 1,
    name: 'Test Stop',
    latitude: 37.7749,
    longitude: -122.4194,
  } as Stop;

  beforeEach(async () => {
    const mockStintsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findAllByTrip: jest.fn(),
      findMaxSequenceNumber: jest.fn(),
      remove: jest.fn(),
    };

    const mockTripsService = {
      findOne: jest.fn(),
    };

    const mockStopsService = {
      createWithTransaction: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StintsService,
        {
          provide: StintsRepository,
          useValue: mockStintsRepository,
        },
        {
          provide: TripsService,
          useValue: mockTripsService,
        },
        {
          provide: StopsService,
          useValue: mockStopsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StintsService>(StintsService);
    stintsRepository = module.get(StintsRepository);
    tripsService = module.get(TripsService);
    stopsService = module.get(StopsService);
    dataSource = module.get(DataSource);
  });

  describe('create', () => {
    const createStintDto: CreateStintDto = {
      name: 'Test Stint',
      sequence_number: 1,
      trip_id: 1,
      notes: 'Test notes',
    };

    it('should create a stint successfully', async () => {
      stintsRepository.create.mockReturnValue(mockStint);
      stintsRepository.save.mockResolvedValue(mockStint);

      const result = await service.create(createStintDto);

      expect(stintsRepository.create).toHaveBeenCalledWith(createStintDto);
      expect(stintsRepository.save).toHaveBeenCalledWith(mockStint);
      expect(result).toBe(mockStint);
    });
  });

  describe('findOne', () => {
    it('should return a stint when found', async () => {
      stintsRepository.findById.mockResolvedValue(mockStint);

      const result = await service.findOne(1);

      expect(stintsRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(mockStint);
    });

    it('should throw NotFoundException when stint not found', async () => {
      stintsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByTrip', () => {
    it('should return stints for a trip', async () => {
      const stints = [mockStint];
      stintsRepository.findAllByTrip.mockResolvedValue(stints);

      const result = await service.findAllByTrip(1);

      expect(stintsRepository.findAllByTrip).toHaveBeenCalledWith(1);
      expect(result).toBe(stints);
    });

    it('should throw NotFoundException when no stints found', async () => {
      stintsRepository.findAllByTrip.mockResolvedValue([]);

      await expect(service.findAllByTrip(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateStintDto = {
      name: 'Updated Stint',
      notes: 'Updated notes',
    };

    it('should update stint successfully when user is creator', async () => {
      const updatedStint = { ...mockStint, ...updateStintDto };
      stintsRepository.findById.mockResolvedValue(mockStint);
      stintsRepository.save.mockResolvedValue(updatedStint);

      const result = await service.update(1, updateStintDto, 1);

      expect(result).toEqual(updatedStint);
      expect(stintsRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not creator', async () => {
      stintsRepository.findById.mockResolvedValue({
        ...mockStint,
        trip: { ...mockTrip, creator_id: 2 },
      } as Stint);

      await expect(service.update(1, updateStintDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should remove stint successfully when user is creator', async () => {
      stintsRepository.findById.mockResolvedValue(mockStint);
      stintsRepository.remove.mockResolvedValue(mockStint);

      await service.remove(1, 1);

      expect(stintsRepository.remove).toHaveBeenCalledWith(mockStint);
    });

    it('should throw ForbiddenException when user is not creator', async () => {
      stintsRepository.findById.mockResolvedValue({
        ...mockStint,
        trip: { ...mockTrip, creator_id: 2 },
      } as Stint);

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
