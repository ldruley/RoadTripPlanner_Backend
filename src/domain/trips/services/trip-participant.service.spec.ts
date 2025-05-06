import { Test, TestingModule } from '@nestjs/testing';
import { TripParticipantService } from '../services/trip-participant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripParticipant } from '../entities/trip-participant.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TripsService } from '../services/trips.service';
import { UsersService } from '../../users/users.service';
import { ParticipantRole } from '../../../common/enums';
import { CreateTripParticipantDto } from '../dto/create-trip-participant.dto';

describe('TripParticipantService', () => {
  let service: TripParticipantService;
  let repository: jest.Mocked<Repository<TripParticipant>>;
  let tripsService: jest.Mocked<TripsService>;
  let usersService: jest.Mocked<UsersService>;

  const mockRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  });

  const mockTrip = {
    trip_id: 1,
    title: 'Test Trip',
    creator_id: 1,
  };

  const mockUser = {
    user_id: 2,
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockParticipant = {
    trip_id: 1,
    user_id: 2,
    role: ParticipantRole.MEMBER,
    joined_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripParticipantService,
        {
          provide: getRepositoryToken(TripParticipant),
          useFactory: mockRepository,
        },
        {
          provide: TripsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TripParticipantService>(TripParticipantService);
    repository = module.get(getRepositoryToken(TripParticipant));
    tripsService = module.get(TripsService);
    usersService = module.get(UsersService);

    // Setup repository methods for common reused functionality
    (service as any).findOneOrThrow = jest.fn();
    (service as any).exists = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getParticipant', () => {
    it('should return a participant when found', async () => {
      (service as any).findOneOrThrow.mockResolvedValue(mockParticipant);

      const result = await service.getParticipant(1, 2);
      expect((service as any).findOneOrThrow).toHaveBeenCalledWith(
        { trip_id: 1, user_id: 2 },
        undefined,
      );
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('addParticipant', () => {
    const createDto: CreateTripParticipantDto = {
      trip_id: 1,
      user_id: 2,
      role: ParticipantRole.MEMBER,
    };

    it('should add a participant successfully', async () => {
      // Mock trip and user existence check
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      usersService.findOne.mockResolvedValue(mockUser as any);

      // Mock participant existence check (should not already exist)
      (service as any).exists.mockResolvedValue(false);

      // Mock repository methods
      repository.create.mockReturnValue(mockParticipant as any);
      repository.save.mockResolvedValue(mockParticipant as any);

      const result = await service.addParticipant(createDto, 1);

      expect(tripsService.findOne).toHaveBeenCalledWith(1, undefined);
      expect(usersService.findOne).toHaveBeenCalledWith(2);
      expect((service as any).exists).toHaveBeenCalledWith(
        { trip_id: 1, user_id: 2 },
        undefined,
      );
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockParticipant);
    });

    it('should throw ForbiddenException when requester is not the trip creator', async () => {
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as any);

      await expect(service.addParticipant(createDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      // @ts-expect-error mocking findOne to return null
      usersService.findOne.mockResolvedValue(null);

      await expect(service.addParticipant(createDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByTrip', () => {
    it('should return all participants for a trip', async () => {
      const participants = [mockParticipant];
      (service as any).findAll.mockResolvedValue(participants);

      const result = await service.findByTrip(1);
      expect((service as any).findAll).toHaveBeenCalledWith(
        { trip_id: 1 },
        undefined,
      );
      expect(result).toEqual(participants);
    });
  });

  describe('findByUser', () => {
    it('should return all trips a user is participating in', async () => {
      const participants = [mockParticipant];
      (service as any).findAll.mockResolvedValue(participants);

      const result = await service.findByUser(2);
      expect((service as any).findAll).toHaveBeenCalledWith(
        { user_id: 2 },
        undefined,
      );
      expect(result).toEqual(participants);
    });
  });

  describe('updateRole', () => {
    it('should update a participant role successfully', async () => {
      const participant = { ...mockParticipant, role: ParticipantRole.MEMBER };
      const updatedParticipant = {
        ...participant,
        role: ParticipantRole.DRIVER,
      };

      tripsService.findOne.mockResolvedValue(mockTrip as any);
      (service as any).getParticipant.mockResolvedValue(participant);
      repository.save.mockResolvedValue(updatedParticipant as any);

      const result = await service.updateRole(1, 2, ParticipantRole.DRIVER, 1);

      expect(tripsService.findOne).toHaveBeenCalledWith(1, undefined);
      expect((service as any).getParticipant).toHaveBeenCalledWith(
        1,
        2,
        undefined,
      );
      expect(repository.save).toHaveBeenCalledWith({
        ...participant,
        role: ParticipantRole.DRIVER,
      });
      expect(result).toEqual(updatedParticipant);
    });

    it('should throw ForbiddenException when requester is not the trip creator', async () => {
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as any);

      await expect(
        service.updateRole(1, 2, ParticipantRole.DRIVER, 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeParticipant', () => {
    it('should remove a participant when requester is trip creator', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      (service as any).getParticipant.mockResolvedValue(mockParticipant);
      repository.remove.mockResolvedValue(mockParticipant as any);

      await service.removeParticipant(1, 2, 1);

      expect(tripsService.findOne).toHaveBeenCalledWith(1, undefined);
      expect((service as any).getParticipant).toHaveBeenCalledWith(1, 2);
      expect(repository.remove).toHaveBeenCalledWith(mockParticipant);
    });

    it('should remove a participant when requester is the participant', async () => {
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as any);
      (service as any).getParticipant.mockResolvedValue(mockParticipant);
      repository.remove.mockResolvedValue(mockParticipant as any);

      await service.removeParticipant(1, 2, 2); // User removing themselves

      expect(repository.remove).toHaveBeenCalledWith(mockParticipant);
    });

    it('should throw ForbiddenException when requester is not creator or participant', async () => {
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as any);

      await expect(service.removeParticipant(1, 2, 3)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('checkParticipation', () => {
    it('should return true when user participates in trip', async () => {
      (service as any).exists.mockResolvedValue(true);

      const result = await service.checkParticipation(1, 2);
      expect((service as any).exists).toHaveBeenCalledWith(
        { trip_id: 1, user_id: 2 },
        undefined,
      );
      expect(result).toBe(true);
    });

    it('should return false when user does not participate in trip', async () => {
      (service as any).exists.mockResolvedValue(false);

      const result = await service.checkParticipation(1, 3);
      expect(result).toBe(false);
    });
  });

  describe('isUserPlannerOrCreator', () => {
    it('should return true when user has planner or creator role', async () => {
      (service as any).exists.mockResolvedValue(true);

      const result = await service.isUserPlannerOrCreator(1, 1);
      expect(result).toBe(true);
    });

    it('should return false when user does not have planner or creator role', async () => {
      (service as any).exists.mockResolvedValue(false);

      const result = await service.isUserPlannerOrCreator(1, 2);
      expect(result).toBe(false);
    });
  });
});
