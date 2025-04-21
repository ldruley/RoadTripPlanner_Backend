import { Test, TestingModule } from '@nestjs/testing';
import { StintsController } from './stints.controller';
import { StintsService } from '../services/stints.service';
import { CreateStintDto } from '../dto/create-stint-dto';
import { CreateStintWithStopDto } from '../dto/create-stint-with-stop.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { StopType } from '../../../common/enums';
import { Stint } from '../entities/stint.entity';
import { Trip } from '../../trips/entities/trip.entity';

describe('StintsController', () => {
  let controller: StintsController;
  let service: jest.Mocked<StintsService>;

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
  };

  const mockTrip: Trip = {
    trip_id: 1,
    title: 'Test Trip',
    description: 'Test Description',
    creator_id: 1,
    is_public: false,
    created_at: new Date(),
    updated_at: new Date(),
    stints: [],
    stops: [],
    creator: mockUser,
  } as Trip;

  const mockStint: Stint = {
    stint_id: 1,
    name: 'California Coast Drive',
    sequence_number: 1,
    trip_id: 1,
    start_location_id: 1,
    end_location_id: null,
    distance: 350.5,
    estimated_duration: 420,
    notes: 'Scenic coastal route',
    created_at: new Date(),
    updated_at: new Date(),
    trip: mockTrip,
    stops: [],
    legs: [],
    participants: [],
    vehicles: [],
  } as unknown as Stint;

  beforeEach(async () => {
    const mockStintsService = {
      create: jest.fn(),
      createWithInitialStop: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StintsController],
      providers: [
        {
          provide: StintsService,
          useValue: mockStintsService,
        },
      ],
    }).compile();

    controller = module.get<StintsController>(StintsController);
    service = module.get(StintsService) as jest.Mocked<StintsService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createStintDto: CreateStintDto = {
      name: 'California Coast Drive',
      sequence_number: 1,
      trip_id: 1,
      start_location_id: 1,
      distance: 350.5,
      estimated_duration: 420,
      notes: 'Scenic coastal route',
    };

    it('should create a new stint successfully', async () => {
      service.create.mockResolvedValue(mockStint);

      const result = await controller.create(createStintDto);

      expect(service.create).toHaveBeenCalledWith(createStintDto);
      expect(result).toBe(mockStint);
    });
  });

  describe('createWithInitialStop', () => {
    const createStintWithStopDto: CreateStintWithStopDto = {
      name: 'California Coast Drive',
      sequence_number: 1,
      trip_id: 1,
      initialStop: {
        name: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Main St, San Francisco, CA',
        stopType: StopType.PITSTOP,
        notes: 'Our journey begins here',
      },
      notes: 'Scenic coastal route',
    };

    it('should create a stint with initial stop successfully', async () => {
      service.createWithInitialStop.mockResolvedValue(mockStint);

      const result = await controller.createWithInitialStop(
        createStintWithStopDto,
        mockUser,
      );

      expect(service.createWithInitialStop).toHaveBeenCalledWith(
        createStintWithStopDto,
        mockUser.user_id,
      );
      expect(result).toBe(mockStint);
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      service.createWithInitialStop.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.createWithInitialStop(createStintWithStopDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return a stint by ID', async () => {
      service.findOne.mockResolvedValue(mockStint);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockStint);
    });

    it('should throw NotFoundException when stint not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateStintDto: CreateStintDto = {
      name: 'Updated Coast Drive',
      sequence_number: 1,
      trip_id: 1,
      notes: 'Updated route',
    };

    it('should update a stint successfully', async () => {
      const updatedStint = { ...mockStint, ...updateStintDto };
      service.update.mockResolvedValue(updatedStint);

      const result = await controller.update(1, updateStintDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(
        1,
        updateStintDto,
        mockUser.user_id,
      );
      expect(result).toBe(updatedStint);
    });

    it('should throw ForbiddenException when user is not authorized', async () => {
      service.update.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update(1, updateStintDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a stint successfully', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(1, mockUser);

      expect(service.remove).toHaveBeenCalledWith(1, mockUser.user_id);
    });

    it('should throw ForbiddenException when user is not authorized', async () => {
      service.remove.mockRejectedValue(new ForbiddenException());

      await expect(controller.remove(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
