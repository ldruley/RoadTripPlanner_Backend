import { Test, TestingModule } from '@nestjs/testing';
import { ItineraryService } from './itinerary.service';
import { StintsService } from './stints.service';
import { StopsService } from './stops.service';
import { LegsService } from './legs.service';
import { StopsRepository } from '../repositories/stops.repository';
import { StintsRepository } from '../repositories/stints.repository';
import { LegsRepository } from '../repositories/legs.repository';
import { TripsService } from '../../trips/trips.service';
import { DataSource, EntityManager } from 'typeorm';
import { CreateStopDto } from '../dto/create-stop.dto';
import { CreateStintWithOptionalStopDto } from '../dto/create-sprint-with-optional-stop.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StopType } from '../../../common/enums';
import { Trip } from '../../trips/entities/trip.entity';
import { Stint } from '../entities/stint.entity';
import { Stop } from '../entities/stop.entity';
import { Leg } from '../entities/leg.entity';

describe('ItineraryService', () => {
  let service: ItineraryService;
  let tripsService: jest.Mocked<TripsService>;
  let stintsService: jest.Mocked<StintsService>;
  let stopsService: jest.Mocked<StopsService>;
  let legsService: jest.Mocked<LegsService>;
  let stopsRepository: jest.Mocked<StopsRepository>;
  let stintsRepository: jest.Mocked<StintsRepository>;
  let legsRepository: jest.Mocked<LegsRepository>;
  let dataSource: jest.Mocked<DataSource>;

  // Mock data
  const mockTrip: Trip = {
    trip_id: 1,
    title: 'Test Trip',
    description: 'Test Description',
    creator_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  } as Trip;

  const mockStint: Stint = {
    stint_id: 1,
    name: 'Test Stint',
    sequence_number: 1,
    trip_id: 1,
    start_location_id: 1,
    distance: 100,
    estimated_duration: 120,
    trip: mockTrip,
    created_at: new Date(),
    updated_at: new Date(),
  } as Stint;

  const mockStop: Stop = {
    stop_id: 1,
    name: 'Test Stop',
    latitude: 37.7749,
    longitude: -122.4194,
    stop_type: StopType.PITSTOP,
    sequence_number: 1,
    trip_id: 1,
    stint_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  } as Stop;

  const mockLeg: Leg = {
    leg_id: 1,
    stint_id: 1,
    start_stop_id: 1,
    end_stop_id: 2,
    sequence_number: 1,
    distance: 25.5,
    estimated_travel_time: 30,
    created_at: new Date(),
    updated_at: new Date(),
  } as Leg;

  beforeEach(async () => {
    // Create mock repositories and services
    const mockTripsService = {
      findOne: jest.fn(),
    };

    const mockStintsService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const mockStopsService = {
      findOne: jest.fn(),
      createWithTransaction: jest.fn(),
    };

    const mockLegsService = {
      findOne: jest.fn(),
    };

    const mockStopsRepository = {
      findById: jest.fn(),
      findAllByTrip: jest.fn(),
      findByStint: jest.fn(),
      findMaxSequenceNumber: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    const mockStintsRepository = {
      findById: jest.fn(),
      findAllByTrip: jest.fn(),
      findMaxSequenceNumber: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockLegsRepository = {
      findById: jest.fn(),
      findByStint: jest.fn(),
      sumEstimatedTravelTime: jest.fn(),
      sumEstimatedTravelDistance: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryService,
        {
          provide: TripsService,
          useValue: mockTripsService,
        },
        {
          provide: StintsService,
          useValue: mockStintsService,
        },
        {
          provide: StopsService,
          useValue: mockStopsService,
        },
        {
          provide: LegsService,
          useValue: mockLegsService,
        },
        {
          provide: StopsRepository,
          useValue: mockStopsRepository,
        },
        {
          provide: StintsRepository,
          useValue: mockStintsRepository,
        },
        {
          provide: LegsRepository,
          useValue: mockLegsRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ItineraryService>(ItineraryService);
    tripsService = module.get(TripsService) as jest.Mocked<TripsService>;
    stintsService = module.get(StintsService) as jest.Mocked<StintsService>;
    stopsService = module.get(StopsService) as jest.Mocked<StopsService>;
    legsService = module.get(LegsService) as jest.Mocked<LegsService>;
    stopsRepository = module.get(
      StopsRepository,
    ) as jest.Mocked<StopsRepository>;
    stintsRepository = module.get(
      StintsRepository,
    ) as jest.Mocked<StintsRepository>;
    legsRepository = module.get(LegsRepository) as jest.Mocked<LegsRepository>;
    dataSource = module.get(DataSource) as jest.Mocked<DataSource>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test for simple methods first
  describe('updateStintDistance', () => {
    it('should calculate and update the stint distance', async () => {
      // Setup
      const stintId = 1;
      const totalDistance = 150.5;

      stintsService.findOne.mockResolvedValue(mockStint);
      legsRepository.sumEstimatedTravelDistance.mockResolvedValue(
        totalDistance,
      );
      stintsRepository.save.mockResolvedValue({
        ...mockStint,
        distance: totalDistance,
      });

      // Execute
      await service.updateStintDistance(stintId);

      // Assert
      expect(legsRepository.sumEstimatedTravelDistance).toHaveBeenCalledWith(
        stintId,
      );
      expect(stintsService.findOne).toHaveBeenCalledWith(stintId);
      expect(stintsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stint_id: stintId,
          distance: totalDistance,
        }),
      );
    });

    it('should throw NotFoundException when stint not found', async () => {
      stintsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.updateStintDistance(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStintDuration', () => {
    it('should calculate and update the stint duration', async () => {
      // Setup
      const stintId = 1;
      const legDuration = 120;
      const stopDuration = 60;
      const totalDuration = legDuration + stopDuration;

      stintsService.findOne.mockResolvedValue(mockStint);
      legsRepository.sumEstimatedTravelTime.mockResolvedValue(legDuration);
      stopsRepository.sumDuration.mockResolvedValue(stopDuration);
      stintsRepository.save.mockResolvedValue({
        ...mockStint,
        estimated_duration: totalDuration,
      });

      // Execute
      await service.updateStintDuration(stintId);

      // Assert
      expect(legsRepository.sumEstimatedTravelTime).toHaveBeenCalledWith(
        stintId,
      );
      expect(stopsRepository.sumDuration).toHaveBeenCalledWith(stintId);
      expect(stintsService.findOne).toHaveBeenCalledWith(stintId);
      expect(stintsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stint_id: stintId,
          estimated_duration: totalDuration,
        }),
      );
    });

    it('should throw NotFoundException when stint not found', async () => {
      stintsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.updateStintDuration(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Test for more complex methods
  describe('addStop', () => {
    const createStopDto: CreateStopDto = {
      name: 'New Stop',
      latitude: 37.7749,
      longitude: -122.4194,
      stop_type: StopType.ATTRACTION,
      sequence_number: 2,
      trip_id: 1,
      stint_id: 1,
      notes: 'Test notes',
    };

    it('should add a stop to a stint', async () => {
      // Setup
      const userId = 1;
      const newStop = { ...mockStop, ...createStopDto };

      stintsService.findOne.mockResolvedValue(mockStint);
      tripsService.findOne.mockResolvedValue(mockTrip);
      stopsRepository.findMaxSequenceNumber.mockResolvedValue(1);

      // Mock transaction
      const mockManager = {
        getRepository: jest.fn().mockImplementation((entity) => {
          return {
            create: jest.fn().mockReturnValue(newStop),
            save: jest.fn().mockResolvedValue(newStop),
            find: jest.fn().mockResolvedValue([mockStop, newStop]),
            findOne: jest.fn().mockResolvedValue(mockStop),
          };
        }),
      };

      dataSource.transaction.mockImplementation(async (cb) => {
        // @ts-expect-error because typescript is annoying
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return cb(mockManager as unknown as EntityManager);
      });

      // Execute
      const result = await service.addStop(createStopDto, userId);

      // Assert
      expect(stintsService.findOne).toHaveBeenCalledWith(
        createStopDto.stint_id,
      );
      expect(tripsService.findOne).toHaveBeenCalledWith(mockStint.trip_id);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result).toEqual(newStop);
    });

    it('should throw ForbiddenException when user is not trip creator', async () => {
      // Setup
      const userId = 2; // Different from trip creator_id

      stintsService.findOne.mockResolvedValue(mockStint);
      tripsService.findOne.mockResolvedValue({ ...mockTrip, creator_id: 1 });

      // Execute & Assert
      await expect(service.addStop(createStopDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when stint not found', async () => {
      stintsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.addStop(createStopDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Start testing the createStint method - one of the more complex ones
  /*describe('createStint', () => {
    const createStintDto: CreateStintWithOptionalStopDto = {
      name: 'New Stint',
      trip_id: 1,
      sequence_number: 1,
      initialStop: {
        name: 'First Stop',
        latitude: 37.7749,
        longitude: -122.4194,
        stopType: StopType.PITSTOP,
        notes: 'First stop notes',
      },
      notes: 'Test stint notes',
      start_time: new Date('2025-05-15T08:00:00Z'),
    };

    it('should create the first stint with initial stop', async () => {
      // Setup
      const userId = 1;
      const newStint = { ...mockStint, name: createStintDto.name };
      const newStop = { ...mockStop, name: createStintDto.initialStop!.name };

      tripsService.findOne.mockResolvedValue(mockTrip);
      stintsRepository.findMaxSequenceNumber.mockResolvedValue(0);

      // Mock transaction
      const mockStopRepo = {
        create: jest.fn().mockReturnValue(newStop),
        save: jest.fn().mockResolvedValue(newStop),
      };

      const mockStintRepo = {
        create: jest.fn().mockReturnValue(newStint),
        save: jest.fn().mockResolvedValue(newStint),
      };

      const mockManager = {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === Stop) return mockStopRepo;
          if (entity === Stint) return mockStintRepo;
          return {};
        }),
      };

      dataSource.transaction.mockImplementation(async (cb) => {
        //@ts-expect-error because typescript is annoying
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return cb(mockManager as unknown as EntityManager);
      });

      stopsService.createWithTransaction.mockResolvedValue(newStop);

      // Execute
      const result = await service.createStint(createStintDto, userId);

      // Assert
      expect(tripsService.findOne).toHaveBeenCalledWith(createStintDto.trip_id);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result).toEqual(newStint);
    });

    it('should throw ForbiddenException when user is not trip creator', async () => {
      // Setup
      const userId = 2; // Different from trip creator_id

      tripsService.findOne.mockResolvedValue({ ...mockTrip, creator_id: 1 });

      // Execute & Assert
      await expect(service.createStint(createStintDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when initialStop is missing for first stint', async () => {
      // Setup
      const userId = 1;
      const incompleteDto = {
        ...createStintDto,
        initialStop: undefined,
      };

      tripsService.findOne.mockResolvedValue(mockTrip);
      stintsRepository.findMaxSequenceNumber.mockResolvedValue(0);

      // Execute & Assert
      await expect(
        service.createStint(incompleteDto, userId),
      ).rejects.toThrow();
    });
  });*/

  // TODO: tests for (we may need to consider fakes for our more complex methods):
  // - getTripTimeline
  // - removeStop
  // - reorderStops
  // - updateLegsAfterStopChanges (private method - may need special handling)
  // - updateStintStartEndLocations (private method)
  // - updateStintTimings (private method)
  // - createStintWithInitialStop
});
