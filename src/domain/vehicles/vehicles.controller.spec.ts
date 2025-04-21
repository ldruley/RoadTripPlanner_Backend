import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle-dto';
import { UpdateVehicleDto } from './dto/update-vehicle-dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Vehicle } from './entities/vehicle.entity';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: jest.Mocked<VehiclesService>;

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

  beforeEach(async () => {
    const mockVehiclesService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByOwner: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get(VehiclesService) as jest.Mocked<VehiclesService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createVehicleDto: CreateVehicleDto = {
      name: 'Toyota Hilux',
      year: 2020,
      fuel_capacity: 50,
      mpg: 25,
      owner_id: 1,
    };

    it('should create a new vehicle successfully', async () => {
      service.create.mockResolvedValue(mockVehicle);

      const result = await controller.create(createVehicleDto, mockUser);

      expect(service.create).toHaveBeenCalledWith({
        ...createVehicleDto,
        owner_id: mockUser.user_id,
      });
      expect(result).toBe(mockVehicle);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by ID', async () => {
      service.findOne.mockResolvedValue(mockVehicle);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockVehicle);
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOwner', () => {
    it('should return vehicles by owner ID', async () => {
      const vehicles = [mockVehicle];
      service.findByOwner.mockResolvedValue(vehicles);

      const result = await controller.findByOwner(1);

      expect(service.findByOwner).toHaveBeenCalledWith(1);
      expect(result).toBe(vehicles);
    });

    it('should throw NotFoundException when no vehicles found', async () => {
      service.findByOwner.mockRejectedValue(new NotFoundException());

      await expect(controller.findByOwner(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByAuthenticatedUser', () => {
    it('should return vehicles for authenticated user', async () => {
      const vehicles = [mockVehicle];
      service.findByOwner.mockResolvedValue(vehicles);

      const result = await controller.findByAuthenticatedUser(mockUser);

      expect(service.findByOwner).toHaveBeenCalledWith(mockUser.user_id);
      expect(result).toBe(vehicles);
    });
  });

  describe('update', () => {
    const updateVehicleDto: UpdateVehicleDto = {
      name: 'Updated Hilux',
      year: 2021,
      fuel_capacity: 55,
      mpg: 30,
    };

    it('should update a vehicle successfully', async () => {
      const updatedVehicle = { ...mockVehicle, ...updateVehicleDto };
      service.update.mockResolvedValue(updatedVehicle);

      const result = await controller.update(
        1,
        updateVehicleDto as any,
        mockUser,
      );

      expect(service.update).toHaveBeenCalledWith(
        1,
        updateVehicleDto,
        mockUser.user_id,
      );
      expect(result).toBe(updatedVehicle);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      service.update.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update(1, updateVehicleDto as any, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
