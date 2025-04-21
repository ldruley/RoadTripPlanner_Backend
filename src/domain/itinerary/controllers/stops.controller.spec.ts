import { Test, TestingModule } from '@nestjs/testing';
import { StopsController } from './stops.controller';
import { StopsService } from '../services/stops.service';
import { UpdateStopDto } from '../dto/update-stop.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { StopType } from '../../../common/enums';
import { Stop } from '../entities/stop.entity';

describe('StopsController', () => {
  let controller: StopsController;
  let service: jest.Mocked<StopsService>;

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
    trip: null as any,
    stint: null as any,
  };

  beforeEach(async () => {
    const mockStopsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findAllByTrip: jest.fn(),
      findAllByStint: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StopsController],
      providers: [
        {
          provide: StopsService,
          useValue: mockStopsService,
        },
      ],
    }).compile();

    controller = module.get<StopsController>(StopsController);
    service = module.get(StopsService) as jest.Mocked<StopsService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a stop by ID', async () => {
      service.findOne.mockResolvedValue(mockStop);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockStop);
    });

    it('should throw NotFoundException when stop not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTrip', () => {
    it('should return all stops for a trip', async () => {
      const stops = [mockStop];
      service.findAllByTrip.mockResolvedValue(stops);

      const result = await controller.findByTrip(1);

      expect(service.findAllByTrip).toHaveBeenCalledWith(1);
      expect(result).toBe(stops);
    });

    it('should throw NotFoundException when no stops found', async () => {
      service.findAllByTrip.mockRejectedValue(new NotFoundException());

      await expect(controller.findByTrip(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByStint', () => {
    it('should return all stops for a stint', async () => {
      const stops = [mockStop];
      service.findAllByStint.mockResolvedValue(stops);

      const result = await controller.findByStint(1);

      expect(service.findAllByStint).toHaveBeenCalledWith(1);
      expect(result).toBe(stops);
    });

    it('should throw NotFoundException when no stops found', async () => {
      service.findAllByStint.mockRejectedValue(new NotFoundException());

      await expect(controller.findByStint(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateStopDto: UpdateStopDto = {
      name: 'Updated Golden Gate Park',
      notes: 'Updated notes',
    };

    it('should update a stop successfully', async () => {
      const updatedStop = { ...mockStop, ...updateStopDto };
      service.update.mockResolvedValue(updatedStop);

      const result = await controller.update(1, updateStopDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(
        1,
        updateStopDto,
        mockUser.user_id,
      );
      expect(result).toBe(updatedStop);
    });

    it('should throw NotFoundException when stop not found', async () => {
      service.update.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update(999, updateStopDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      service.update.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update(1, updateStopDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
