import { Test, TestingModule } from '@nestjs/testing';
import { StintVehicleService } from './stint-vehicle.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StintVehicle } from '../entities/stint-vehicle.entity';
import { Repository } from 'typeorm';
import { StintsService } from './stints.service';
import { VehiclesService } from '../../vehicles/vehicles.service';
import { UsersService } from '../../users/users.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateStintVehicleDto } from '../dto/create-stint-vehicle.dto';
import { UpdateStintVehicleDto } from '../dto/update-stint-vehicle.dto';
import { Stint } from '../entities/stint.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { User } from '../../users/entities/user.entity';

describe('StintVehicleService', () => {
  let service: StintVehicleService;
  let repository: jest.Mocked<Repository<StintVehicle>>;
  let stintsService: jest.Mocked<StintsService>;
  let vehiclesService: jest.Mocked<VehiclesService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
    user_id: 2,
    username: 'driveruser',
    fullname: 'Driver User',
    email: 'driver@example.com',
    password_hash: 'hashed',
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
    owner: null as any,
  };

  const mockTrip = {
    trip_id: 1,
    title: 'Test Trip',
    creator_id: 1,
  };

  const mockStint: Stint = {
    stint_id: 1,
    name: 'Test Stint',
    sequence_number: 1,
    trip_id: 1,
    trip: mockTrip as any,
    distance: 100,
    estimated_duration: 120,
    created_at: new Date(),
    updated_at: new Date(),
    start_time: new Date(),
    end_time: new Date(),
    continues_from_previous: false,
    notes: 'Test notes',
    start_location_id: null,
    start_location: null as any,
    end_location_id: null,
    end_location: null as any,
    stops: [],
    legs: [],
  };

  const mockStintVehicle: StintVehicle = {
    stint_vehicle_id: 1,
    stint_id: 1,
    vehicle_id: 1,
    driver_id: 2,
    created_at: new Date(),
    stint: mockStint,
    vehicle: mockVehicle,
    driver: mockUser,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const mockStintsService = {
      findByIdWithRelationsOrThrow: jest.fn(),
    };

    const mockVehiclesService = {
      findOne: jest.fn(),
    };

    const mockUsersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StintVehicleService,
        {
          provide: getRepositoryToken(StintVehicle),
          useValue: mockRepository,
        },
        {
          provide: StintsService,
          useValue: mockStintsService,
        },
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<StintVehicleService>(StintVehicleService);
    repository = module.get(getRepositoryToken(StintVehicle));
    stintsService = module.get(StintsService);
    vehiclesService = module.get(VehiclesService);
    usersService = module.get(UsersService);

    // Mock BaseService methods
    (service as any).findOneOrThrow = jest.fn();
    (service as any).findOneOrNull = jest.fn();
    (service as any).findAll = jest.fn();
    (service as any).exists = jest.fn();
    (service as any).save = jest.fn();
    (service as any).delete = jest.fn();
    (service as any).getRepo = jest.fn().mockReturnValue(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assignVehicle', () => {
    const createDto: CreateStintVehicleDto = {
      stint_id: 1,
      vehicle_id: 1,
      driver_id: 2,
    };

    it('should assign a vehicle to a stint successfully', async () => {
      stintsService.findByIdWithRelationsOrThrow.mockResolvedValue(mockStint);
      vehiclesService.findOne.mockResolvedValue(mockVehicle);
      usersService.findOne.mockResolvedValue(mockUser);
      (service as any).findOneOrNull.mockResolvedValue(null); // No existing assignment
      repository.create.mockReturnValue(mockStintVehicle);
      repository.save.mockResolvedValue(mockStintVehicle);

      const result = await service.assignVehicle(createDto, 1);

      expect(stintsService.findByIdWithRelationsOrThrow).toHaveBeenCalledWith(
        1,
        undefined,
      );
      expect(vehiclesService.findOne).toHaveBeenCalledWith(1, undefined);
      expect(usersService.findOne).toHaveBeenCalledWith(2, undefined);
      expect((service as any).findOneOrNull).toHaveBeenCalledWith(
        { stint_id: 1, vehicle_id: 1 },
        undefined,
      );
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockStintVehicle);
      expect(result).toEqual(mockStintVehicle);
    });

    it('should throw ConflictException when vehicle is already assigned', async () => {
      stintsService.findByIdWithRelationsOrThrow.mockResolvedValue(mockStint);
      vehiclesService.findOne.mockResolvedValue(mockVehicle);
      usersService.findOne.mockResolvedValue(mockUser);
      (service as any).findOneOrNull.mockResolvedValue(mockStintVehicle); // Existing assignment

      await expect(service.assignVehicle(createDto, 1)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when stint does not exist', async () => {
      stintsService.findByIdWithRelationsOrThrow.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.assignVehicle(createDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByStint', () => {
    it('should return all vehicles assigned to a stint', async () => {
      const stintVehicles = [mockStintVehicle];
      (service as any).findAll.mockResolvedValue(stintVehicles);

      const result = await service.findByStint(1);

      expect((service as any).findAll).toHaveBeenCalledWith(
        { stint_id: 1 },
        undefined,
      );
      expect(result).toEqual(stintVehicles);
    });
  });

  describe('updateDriver', () => {
    const updateDto: UpdateStintVehicleDto = {
      stint_id: 1,
      vehicle_id: 1,
      driver_id: 3,
    };

    it('should update the driver for a vehicle assignment', async () => {
      const newDriver: User = {
        ...mockUser,
        user_id: 3,
        username: 'newdriver',
      };

      const updatedStintVehicle = {
        ...mockStintVehicle,
        driver_id: 3,
        driver: newDriver,
      };

      stintsService.findByIdWithRelationsOrThrow.mockResolvedValue(mockStint);
      (service as any).findOneOrThrow.mockResolvedValue(mockStintVehicle);
      usersService.findOne.mockResolvedValue(newDriver);
      (service as any).save.mockResolvedValue(updatedStintVehicle);

      const result = await service.updateDriver(updateDto, 1);

      expect(stintsService.findByIdWithRelationsOrThrow).toHaveBeenCalledWith(
        1,
        undefined,
      );
      expect((service as any).findOneOrThrow).toHaveBeenCalledWith(
        { stint_id: 1, vehicle_id: 1 },
        undefined,
      );
      expect(usersService.findOne).toHaveBeenCalledWith(3, undefined);
      expect((service as any).save).toHaveBeenCalledWith({
        ...mockStintVehicle,
        driver_id: 3,
      });
      expect(result).toEqual(updatedStintVehicle);
    });

    it('should throw BadRequestException when driver ID is not provided', async () => {
      const badUpdateDto = {
        stint_id: 1,
        vehicle_id: 1,
      };

      stintsService.findByIdWithRelationsOrThrow.mockResolvedValue(mockStint);
      (service as any).findOneOrThrow.mockResolvedValue(mockStintVehicle);

      await expect(
        service.updateDriver(badUpdateDto as any, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when stint vehicle assignment does not exist', async () => {
      stintsService.findByIdWithRelationsOrThrow.mockResolvedValue(mockStint);
      (service as any).findOneOrThrow.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.updateDriver(updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeVehicle', () => {
    it('should remove a vehicle assignment', async () => {
      stintsService.findByIdWithRelationsOrThrow.mockResolvedValue(mockStint);
      (service as any).findOneOrThrow.mockResolvedValue(mockStintVehicle);
      (service as any).delete.mockResolvedValue({ affected: 1 });

      await service.removeVehicle(1, 1, 1);

      expect(stintsService.findByIdWithRelationsOrThrow).toHaveBeenCalledWith(
        1,
        undefined,
      );
      expect((service as any).findOneOrThrow).toHaveBeenCalledWith(
        { stint_id: 1, vehicle_id: 1 },
        undefined,
      );
      expect((service as any).delete).toHaveBeenCalledWith(
        { stint_id: 1, vehicle_id: 1 },
        undefined,
      );
    });

    it('should throw NotFoundException when stint or vehicle assignment does not exist', async () => {
      stintsService.findByIdWithRelationsOrThrow.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.removeVehicle(999, 1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByVehicle', () => {
    it('should return all stint assignments for a vehicle', async () => {
      const stintVehicles = [mockStintVehicle];
      (service as any).findAll.mockResolvedValue(stintVehicles);

      const result = await service.findByVehicle(1);

      expect((service as any).findAll).toHaveBeenCalledWith(
        { vehicle_id: 1 },
        undefined,
      );
      expect(result).toEqual(stintVehicles);
    });
  });

  describe('isVehicleAssigned', () => {
    it('should return true when vehicle is assigned to stint', async () => {
      (service as any).exists.mockResolvedValue(true);

      const result = await service.isVehicleAssigned(1, 1);

      expect((service as any).exists).toHaveBeenCalledWith(
        { vehicle_id: 1, stint_id: 1 },
        undefined,
      );
      expect(result).toBe(true);
    });

    it('should return false when vehicle is not assigned to stint', async () => {
      (service as any).exists.mockResolvedValue(false);

      const result = await service.isVehicleAssigned(1, 999);

      expect(result).toBe(false);
    });
  });
});
