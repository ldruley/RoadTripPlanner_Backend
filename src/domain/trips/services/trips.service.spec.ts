import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from '../services/trips.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Trip } from '../entities/trip.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { TripParticipant } from '../entities/trip-participant.entity';
import { ParticipantRole } from '../../../common/enums';
import { CreateTripDto } from '../dto/create-trip.dto';
import { UpdateTripDto } from '../dto/update-trip-dto';
import { User } from '../../users/entities/user.entity';

describe('TripsService', () => {
  let service: TripsService;
  let tripRepository: jest.Mocked<Repository<Trip>>;
  let tripParticipantRepository: jest.Mocked<Repository<TripParticipant>>;

  const mockTripRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    })),
  });

  const mockTripParticipantRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
  });
  const mockUser = {
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
  } as User;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: getRepositoryToken(Trip),
          useFactory: mockTripRepository,
        },
        {
          provide: getRepositoryToken(TripParticipant),
          useFactory: mockTripParticipantRepository,
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    (service as any).exists = jest.fn();
    tripRepository = module.get(getRepositoryToken(Trip));
    tripParticipantRepository = module.get(getRepositoryToken(TripParticipant));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /*describe('create', () => {
    const createTripDto: CreateTripDto = {
      title: 'New Trip',
      description: 'New Description',
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-06-10'),
      is_public: false,
    };

    const mockUser = { user_id: 1 };

    it('should create a new trip and add the creator as a participant', async () => {
      // Setup trip repository mock
      tripRepository.create.mockReturnValue(mockTrip);
      tripRepository.save.mockResolvedValue(mockTrip);

      // Setup participant repository mock
      const mockParticipant = {
        trip_id: mockTrip.trip_id,
        user_id: mockUser.user_id,
        role: ParticipantRole.CREATOR,
      };
      tripParticipantRepository.create.mockReturnValue(mockParticipant as any);

      // Since we're using withTransaction, we need to mock the transaction behavior
      // This is a simplification; in a real test, you'd need to handle this more comprehensively
      (service as any).withTransaction = jest
        .fn()
        .mockImplementation(async (fn) => {
          return fn({
            getRepository: (entity: any) => {
              if (entity === Trip) return tripRepository;
              if (entity === TripParticipant) return tripParticipantRepository;
              return null;
            },
          });
        });

      // Execute the method
      const result = await service.create({
        ...createTripDto,
        creator_id: mockUser.user_id,
      });

      // Verify results
      expect(tripRepository.create).toHaveBeenCalledWith({
        ...createTripDto,
        creator_id: mockUser.user_id,
      });
      expect(tripRepository.save).toHaveBeenCalled();
      expect(tripParticipantRepository.create).toHaveBeenCalledWith({
        trip_id: mockTrip.trip_id,
        user_id: mockUser.user_id,
        role: ParticipantRole.CREATOR,
        joined_at: expect.any(Date),
      });
      expect(tripParticipantRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTrip);
    });
  });*/

  describe('create', () => {
    const createTripDto: CreateTripDto = {
      title: 'New Trip',
      description: 'New Description',
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-06-10'),
      is_public: false,
    };

    const mockUser = { user_id: 1 };

    it('should create a new trip and add the creator as a participant', () => {
      // Setup trip repository mock
      tripRepository.create.mockReturnValue(mockTrip);
      tripRepository.save.mockResolvedValue(mockTrip);

      // Setup participant repository mock
      const mockParticipant = {
        trip_id: mockTrip.trip_id,
        user_id: mockUser.user_id,
        role: ParticipantRole.CREATOR,
      };
      tripParticipantRepository.create.mockReturnValue(mockParticipant as any);

      // Mock the withTransaction method
      jest
        .spyOn(service as any, 'withTransaction')
        .mockImplementation(async (fn: (manager: any) => Promise<any>) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return fn({
            getRepository: (entity: any) => {
              if (entity === Trip) return tripRepository;
              if (entity === TripParticipant) return tripParticipantRepository;
              return null;
            },
          });
        });

      // Execute the method
      return service
        .create({
          ...createTripDto,
          creator_id: mockUser.user_id,
        })
        .then((result) => {
          // Verify results
          expect(tripRepository.create).toHaveBeenCalledWith({
            ...createTripDto,
            creator_id: mockUser.user_id,
          });
          expect(tripRepository.save).toHaveBeenCalled();
          expect(tripParticipantRepository.create).toHaveBeenCalledWith({
            trip_id: mockTrip.trip_id,
            user_id: mockUser.user_id,
            role: ParticipantRole.CREATOR,
            joined_at: expect.any(Date),
          });
          expect(tripParticipantRepository.save).toHaveBeenCalled();
          expect(result).toEqual(mockTrip);
        });
    });
  });

  describe('findOne', () => {
    it('should return a trip when it exists', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);

      const result = await service.findOne(1);
      expect(tripRepository.findOne).toHaveBeenCalledWith({
        where: { trip_id: 1 },
      });
      expect(result).toEqual(mockTrip);
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      tripRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCreator', () => {
    it('should return trips created by a specific user', async () => {
      const trips = [mockTrip];
      tripRepository.find.mockResolvedValue(trips);

      const result = await service.findByCreator(1);
      expect(tripRepository.find).toHaveBeenCalledWith({
        where: { creator_id: 1 },
      });
      expect(result).toEqual(trips);
    });
  });

  describe('update', () => {
    const updateTripDto: UpdateTripDto = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    it('should update a trip when the user is the creator', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      const updatedTrip = { ...mockTrip, ...updateTripDto };
      tripRepository.save.mockResolvedValue(updatedTrip);

      const result = await service.update(1, updateTripDto, 1);

      expect(tripRepository.findOne).toHaveBeenCalledWith({
        where: { trip_id: 1 },
      });
      expect(tripRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedTrip);
    });

    it('should throw ForbiddenException when user is not the creator', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);

      await expect(service.update(1, updateTripDto, 999)).rejects.toThrow(
        ForbiddenException,
      );
      expect(tripRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      tripRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateTripDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a trip when the user is the creator', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);
      tripRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, 1);

      expect(tripRepository.findOne).toHaveBeenCalledWith({
        where: { trip_id: 1 },
      });
      expect(tripRepository.delete).toHaveBeenCalledWith({ trip_id: 1 });
    });

    it('should throw ForbiddenException when user is not the creator', async () => {
      tripRepository.findOne.mockResolvedValue(mockTrip);

      await expect(service.remove(1, 999)).rejects.toThrow(ForbiddenException);
      expect(tripRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      tripRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkUserInTrip', () => {
    it('should return true when user is the creator of the trip', async () => {
      (service as any).exists.mockResolvedValue(true);

      const result = await service.checkUserInTrip(1, 1);
      expect(result).toBe(true);
    });

    it('should return false when user is not the creator of the trip', async () => {
      (service as any).exists.mockResolvedValue(false);

      const result = await service.checkUserInTrip(1, 1);
      expect(result).toBe(false);
    });
  });
});
