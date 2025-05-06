import { Test, TestingModule } from '@nestjs/testing';
import { StintVehicleController } from './stint-vehicle.controller';
import { StintVehicleService } from '../services/stint-vehicle.service';
import { CreateStintVehicleDto } from '../dto/create-stint-vehicle.dto';
import { UpdateStintVehicleDto } from '../dto/update-stint-vehicle.dto';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { StintVehicle } from '../entities/stint-vehicle.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

describe('StintVehicleController', () => {
  let controller: StintVehicleController;
  let service: jest.Mocked<StintVehicleService>;

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

  const mockVehicle: Vehicle = {
    vehicle_id: 1,
    name: 'Toyota Hilux',
    year: 2020,
    fuel_capacity: 50,
    mpg: 25,
    owner_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    owner: mockUser,
  };

  const mockStintVehicle: StintVehicle = {
    stint_vehicle_id: 1,
    stint_id: 1,
    vehicle_id: 1,
    driver_id: 1,
    created_at: new Date(),
    stint: null as any,
    vehicle: mockVehicle,
    driver: mockUser,
  };

  beforeEach(async () => {
    const mockStintVehicleService = {
      findByStint: jest.fn(),
      isVehicleAssigned: jest.fn(),
      assignVehicle: jest.fn(),
      updateDriver: jest.fn(),
      removeVehicle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StintVehicleController],
      providers: [
        {
          provide: StintVehicleService,
          useValue: mockStintVehicleService,
        },
      ],
    }).compile();

    controller = module.get<StintVehicleController>(StintVehicleController);
    service = module.get(StintVehicleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all vehicles assigned to a stint', async () => {
      const stintVehicles = [mockStintVehicle];
      service.findByStint.mockResolvedValue(stintVehicles);

      const result = await controller.findAll(1);

      expect(service.findByStint).toHaveBeenCalledWith(1);
      expect(result).toEqual(stintVehicles);
    });
  });

  describe('checkVehicleAssignment', () => {
    it('should return true when vehicle is assigned to a stint', async () => {
      service.isVehicleAssigned.mockResolvedValue(true);

      const result = await controller.checkVehicleAssignment(1, 1);

      expect(service.isVehicleAssigned).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });

    it('should return false when vehicle is not assigned to a stint', async () => {
      service.isVehicleAssigned.mockResolvedValue(false);

      const result = await controller.checkVehicleAssignment(1, 2);

      expect(service.isVehicleAssigned).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(false);
    });
  });

  describe('assignVehicle', () => {
    const createDto: CreateStintVehicleDto = {
      stint_id: 1,
      vehicle_id: 1,
      driver_id: 1,
    };

    it('should assign a vehicle to a stint', async () => {
      service.assignVehicle.mockResolvedValue(mockStintVehicle);

      const result = await controller.assignVehicle(1, createDto, mockUser);

      expect(service.assignVehicle).toHaveBeenCalledWith(
        createDto,
        mockUser.user_id,
      );
      expect(result).toEqual(mockStintVehicle);
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.assignVehicle.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.assignVehicle(1, createDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when vehicle is already assigned', async () => {
      service.assignVehicle.mockRejectedValue(new ConflictException());

      await expect(
        controller.assignVehicle(1, createDto, mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateVehicleAssignment', () => {
    const updateDto: UpdateStintVehicleDto = {
      stint_id: 1,
      vehicle_id: 1,
      driver_id: 2,
    };

    it('should update a vehicle assignment', async () => {
      const updatedStintVehicle = { ...mockStintVehicle, driver_id: 2 };
      service.updateDriver.mockResolvedValue(updatedStintVehicle);

      const result = await controller.updateVehicleAssignment(
        updateDto,
        mockUser,
      );

      expect(service.updateDriver).toHaveBeenCalledWith(
        updateDto,
        mockUser.user_id,
      );
      expect(result).toEqual(updatedStintVehicle);
    });

    it('should throw NotFoundException when assignment not found', async () => {
      service.updateDriver.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateVehicleAssignment(updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.updateDriver.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.updateVehicleAssignment(updateDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeVehicleAssignment', () => {
    it('should remove a vehicle assignment', async () => {
      service.removeVehicle.mockResolvedValue(undefined);

      await controller.removeVehicleAssignment(1, 1, mockUser);

      expect(service.removeVehicle).toHaveBeenCalledWith(
        1,
        1,
        mockUser.user_id,
      );
    });

    it('should throw NotFoundException when assignment not found', async () => {
      service.removeVehicle.mockRejectedValue(new NotFoundException());

      await expect(
        controller.removeVehicleAssignment(1, 1, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.removeVehicle.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.removeVehicleAssignment(1, 1, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
