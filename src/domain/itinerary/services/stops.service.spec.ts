import { Test, TestingModule } from '@nestjs/testing';
import { StopsService } from './stops.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Stop } from '../entities/stop.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { LocationsService } from '../../locations/locations.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { StopType } from '../../../common/enums';

describe('StopsService', () => {
  let service: StopsService;
  let repository: jest.Mocked<Repository<Stop>>;
  let locationsService: jest.Mocked<LocationsService>;

  const mockStint = {
    stint_id: 1,
    trip_id: 1,
    start_date: new Date(),
    end_date: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockLocation = {
    location_id: 1,
    name: 'Golden Gate Park',
    latitude: 37.7749,
    longitude: -122.4194,
    address: '501 Stanyan St, San Francisco, CA 94117',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94117',
    country: 'USA',
    created_at: new Date(),
    updated_at: new Date(),
    geom: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749],
    },
  };

  const mockStop = {
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

  const mockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      execute: jest.fn(),
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StopsService,
        {
          provide: getRepositoryToken(Stop),
          useFactory: mockRepository,
        },
        {
          provide: LocationsService,
          useValue: {
            findById: jest.fn(),
            findByCoordinates: jest.fn(),
            create: jest.fn(),
            createLocation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StopsService>(StopsService);
    repository = module.get(getRepositoryToken(Stop));
    locationsService = module.get(LocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a stop when found', async () => {
      repository.findOne.mockResolvedValue(mockStop as Stop);

      const result = await service.findById(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { stop_id: 1 },
        relations: ['location'],
      });
      expect(result).toEqual(mockStop);
    });

    it('should throw NotFoundException when stop not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByStint', () => {
    it('should return all stops for a stint', async () => {
      const stops = [mockStop];
      repository.find.mockResolvedValue(stops as Stop[]);

      const result = await service.findAllByStint(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { stint_id: 1 },
        order: { sequence_number: 'ASC' },
      });
      expect(result).toEqual(stops);
    });

    it('should return null when no stops found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAllByStint(999);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
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

    it('should create a stop with existing location', async () => {
      // Setup for a case with an existing location
      const locationId = 1;
      createStopDto.location_id = locationId;

      locationsService.findById.mockResolvedValue(mockLocation);
      repository.create.mockReturnValue(mockStop as Stop);
      repository.save.mockResolvedValue(mockStop as Stop);

      // Mock the sequence number calculation
      jest.spyOn(service, 'findMaxSequenceNumber').mockResolvedValue(0);
      jest.spyOn(service, 'shiftStopSequences').mockResolvedValue();

      const result = await service.create(createStopDto, 1);

      expect(locationsService.findById).toHaveBeenCalledWith(
        locationId,
        undefined,
      );
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockStop);
    });

    it('should create a stop with new location if location does not exist', async () => {
      // Setup for a case without an existing location
      const createDtoWithoutLocationId = { ...createStopDto };
      delete createDtoWithoutLocationId.location_id;

      locationsService.findByCoordinates.mockResolvedValue(null);
      locationsService.createLocation.mockResolvedValue({
        ...mockLocation,
        location_id: 2,
      });

      repository.create.mockReturnValue({
        ...mockStop,
        location_id: 2,
      } as Stop);
      repository.save.mockResolvedValue({
        ...mockStop,
        location_id: 2,
      } as Stop);

      // Mock the sequence number calculation
      jest.spyOn(service, 'findMaxSequenceNumber').mockResolvedValue(0);
      jest.spyOn(service, 'shiftStopSequences').mockResolvedValue();

      const result = await service.create(createDtoWithoutLocationId, 1);

      expect(locationsService.findByCoordinates).toHaveBeenCalledWith(
        createDtoWithoutLocationId.latitude,
        createDtoWithoutLocationId.longitude,
      );
      expect(locationsService.createLocation).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.location_id).toEqual(2);
    });

    it('should add a stop at the end of the sequence when no sequence number provided', async () => {
      const createDtoNoSequence = { ...createStopDto };
      delete createDtoNoSequence.sequence_number;

      jest.spyOn(service, 'findMaxSequenceNumber').mockResolvedValue(2);
      locationsService.findByCoordinates.mockResolvedValue(mockLocation);
      repository.create.mockReturnValue({
        ...mockStop,
        sequence_number: 3,
      } as Stop);
      repository.save.mockResolvedValue({
        ...mockStop,
        sequence_number: 3,
      } as Stop);

      const result = await service.create(createDtoNoSequence, 1);

      expect(service.findMaxSequenceNumber).toHaveBeenCalledWith(
        createDtoNoSequence.stint_id,
      );
      expect(result.sequence_number).toEqual(3);
    });

    it('should shift other stops when inserting at a specific position', async () => {
      const createDtoWithSequence = {
        ...createStopDto,
        sequence_number: 2,
      };

      jest.spyOn(service, 'findMaxSequenceNumber').mockResolvedValue(3);
      jest.spyOn(service, 'shiftStopSequences').mockResolvedValue();

      locationsService.findByCoordinates.mockResolvedValue(mockLocation);
      repository.create.mockReturnValue({
        ...mockStop,
        sequence_number: 2,
      } as Stop);
      repository.save.mockResolvedValue({
        ...mockStop,
        sequence_number: 2,
      } as Stop);

      const result = await service.create(createDtoWithSequence, 1);

      expect(service.shiftStopSequences).toHaveBeenCalledWith(
        createDtoWithSequence.stint_id,
        2,
        1,
        undefined,
      );
      expect(result.sequence_number).toEqual(2);
    });
  });

  describe('delete', () => {
    it('should delete a stop and shift sequence numbers', async () => {
      repository.findOne.mockResolvedValue(mockStop as Stop);
      repository.remove.mockResolvedValue(mockStop as Stop);

      jest.spyOn(service, 'shiftStopSequences').mockResolvedValue();

      const result = await service.delete(1, 1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { stop_id: 1 },
      });
      expect(service.shiftStopSequences).toHaveBeenCalledWith(
        mockStop.stint_id,
        mockStop.sequence_number + 1,
        -1,
        undefined,
      );
      expect(repository.remove).toHaveBeenCalledWith(mockStop);
      expect(result).toEqual(mockStop);
    });

    it('should return null when stop not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.delete(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('shiftStopSequences', () => {
    it('should shift stop sequences', async () => {
      const queryBuilder = repository.createQueryBuilder();

      await service.shiftStopSequences(1, 2, 1);

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.update).toHaveBeenCalled;
      expect(queryBuilder.set).toHaveBeenCalled;
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'stint_id = :stintId AND sequence_number >= :startSequence',
        { stintId: 1, startSequence: 2 },
      );
      expect(queryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('findMaxSequenceNumber', () => {
    it('should return the maximum sequence number', async () => {
      const queryBuilder = repository.createQueryBuilder();
      queryBuilder.getRawOne.mockResolvedValue({ maxSequence: '3' });

      const result = await service.findMaxSequenceNumber(1);

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.select).toHaveBeenCalledWith(
        'MAX(stop.sequence_number)',
        'maxSequence',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'stop.stint_id = :stint_id',
        { stint_id: 1 },
      );
      expect(result).toEqual(3);
    });

    it('should return 0 when no stops exist', async () => {
      const queryBuilder = repository.createQueryBuilder();
      queryBuilder.getRawOne.mockResolvedValue({ maxSequence: null });

      const result = await service.findMaxSequenceNumber(1);

      expect(result).toEqual(0);
    });
  });

  describe('countByStint', () => {
    it('should return the number of stops in a stint', async () => {
      repository.count.mockResolvedValue(3);

      const result = await service.countByStint(1);

      expect(repository.count).toHaveBeenCalledWith({ where: { stint_id: 1 } });
      expect(result).toEqual(3);
    });
  });

  describe('getStintEnd', () => {
    it('should return the last stop in a stint', async () => {
      jest.spyOn(service, 'findMaxSequenceNumber').mockResolvedValue(3);
      repository.findOne.mockResolvedValue({
        ...mockStop,
        sequence_number: 3,
      } as Stop);

      const result = await service.getStintEnd(1);

      expect(service.findMaxSequenceNumber).toHaveBeenCalledWith(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          sequence_number: 3,
          stint_id: 1,
        },
      });
      expect(result.sequence_number).toEqual(3);
    });

    it('should throw NotFoundException when no end stop found', async () => {
      jest.spyOn(service, 'findMaxSequenceNumber').mockResolvedValue(3);
      repository.findOne.mockResolvedValue(null);

      await expect(service.getStintEnd(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('sumDuration', () => {
    it('should return the sum of durations for all stops in a stint', async () => {
      const queryBuilder = repository.createQueryBuilder();
      queryBuilder.getRawOne.mockResolvedValue({ total: 420 });

      const result = await service.sumDuration(1);

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.select).toHaveBeenCalledWith(
        'SUM(stop.duration)',
        'total',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'stop.stint_id = :stint_id',
        { stint_id: 1 },
      );
      expect(result).toEqual(420);
    });

    it('should return 0 when no stops have duration set', async () => {
      const queryBuilder = repository.createQueryBuilder();
      queryBuilder.getRawOne.mockResolvedValue({ total: null });

      const result = await service.sumDuration(1);

      expect(result).toEqual(0);
    });
  });
});
