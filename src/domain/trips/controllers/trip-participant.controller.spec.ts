import { Test, TestingModule } from '@nestjs/testing';
import { TripParticipantsController } from '../controllers/trip-participant.controller';
import { TripParticipantService } from '../services/trip-participant.service';
import { CreateTripParticipantDto } from '../dto/create-trip-participant.dto';
import { UpdateTripParticipantDto } from '../dto/update-trip-participant.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { ParticipantRole } from '../../../common/enums';

describe('TripParticipantsController', () => {
  let controller: TripParticipantsController;
  let service: jest.Mocked<TripParticipantService>;

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

  const mockParticipant = {
    trip_id: 1,
    user_id: 2,
    role: ParticipantRole.MEMBER,
    joined_at: new Date(),
    user: {
      user_id: 2,
      username: 'participant',
      fullname: 'Participant User',
    },
  };

  beforeEach(async () => {
    const mockTripParticipantService = {
      getParticipant: jest.fn(),
      findByTrip: jest.fn(),
      addParticipant: jest.fn(),
      updateRole: jest.fn(),
      removeParticipant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripParticipantsController],
      providers: [
        {
          provide: TripParticipantService,
          useValue: mockTripParticipantService,
        },
      ],
    }).compile();

    controller = module.get<TripParticipantsController>(
      TripParticipantsController,
    );
    service = module.get(TripParticipantService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkParticipation', () => {
    it('should return participant when user is participating', async () => {
      service.getParticipant.mockResolvedValue(mockParticipant as any);

      const result = await controller.checkParticipation(1, 2);

      expect(service.getParticipant).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(mockParticipant);
    });

    it('should throw NotFoundException when user is not participating', async () => {
      service.getParticipant.mockRejectedValue(new NotFoundException());

      await expect(controller.checkParticipation(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all participants for a trip', async () => {
      const participants = [mockParticipant];
      service.findByTrip.mockResolvedValue(participants as any);

      const result = await controller.findAll(1);

      expect(service.findByTrip).toHaveBeenCalledWith(1);
      expect(result).toBe(participants);
    });

    it('should throw NotFoundException when trip not found', async () => {
      service.findByTrip.mockRejectedValue(new NotFoundException());

      await expect(controller.findAll(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addParticipant', () => {
    const createDto: CreateTripParticipantDto = {
      trip_id: 1,
      user_id: 2,
      role: ParticipantRole.MEMBER,
    };

    it('should add a participant successfully', async () => {
      service.addParticipant.mockResolvedValue(mockParticipant as any);

      const result = await controller.addParticipant(1, createDto, mockUser);

      expect(service.addParticipant).toHaveBeenCalledWith(
        { ...createDto, trip_id: 1 },
        mockUser.user_id,
      );
      expect(result).toBe(mockParticipant);
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.addParticipant.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.addParticipant(1, createDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateRole', () => {
    const updateDto: UpdateTripParticipantDto = {
      role: ParticipantRole.DRIVER,
    };

    it('should update participant role successfully', async () => {
      const updatedParticipant = {
        ...mockParticipant,
        role: ParticipantRole.DRIVER,
      };
      service.updateRole.mockResolvedValue(updatedParticipant as any);

      const result = await controller.updateRole(1, 2, updateDto, mockUser);

      expect(service.updateRole).toHaveBeenCalledWith(
        1,
        2,
        updateDto.role,
        mockUser.user_id,
      );
      expect(result).toBe(updatedParticipant);
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.updateRole.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.updateRole(1, 2, updateDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant successfully', async () => {
      service.removeParticipant.mockResolvedValue(undefined);

      await controller.removeParticipant(1, 2, mockUser);

      expect(service.removeParticipant).toHaveBeenCalledWith(
        1,
        2,
        mockUser.user_id,
      );
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.removeParticipant.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.removeParticipant(1, 2, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
