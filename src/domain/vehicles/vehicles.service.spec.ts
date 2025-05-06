import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateVehicleDto } from './dto/create-vehicle-dto';
import { UpdateVehicleDto } from './dto/update-vehicle-dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Vehicle } from './entities/vehicle.entity';
import { Repository } from 'typeorm';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: jest.Mocked<Repository<Vehicle>>;

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

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    repository = module.get(getRepositoryToken(Vehicle));

    // Mock BaseService methods
    (service as any).findOneOrThrow = jest.fn();
    (service as any).findAll = jest.fn();
    (service as any).getRepo = jest.fn().mockReturnValue(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createVehicleDto: CreateVehicleDto = {
      name: 'Toyota Hilux',
      year: 2020,
      fuel_capacity: 50,
      mpg: 25,
      owner_id: 1,
    };

    it('should create a vehicle successfully', async () => {
      repository.create.mockReturnValue(mockVehicle);
      repository.save.mockResolvedValue(mockVehicle);

      const result = await service.create(createVehicleDto);

      expect(repository.create).toHaveBeenCalledWith(createVehicleDto);
      expect(repository.save).toHaveBeenCalledWith(mockVehicle);
      expect(result).toEqual(mockVehicle);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle when found', async () => {
      (service as any).findOneOrThrow.mockResolvedValue(mockVehicle);

      const result = await service.findOne(1);

      expect((service as any).findOneOrThrow).toHaveBeenCalledWith(
        { vehicle_id: 1 },
        undefined,
      );
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      (service as any).findOneOrThrow.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOwner', () => {
    it('should return vehicles for owner', async () => {
      const vehicles = [mockVehicle];
      (service as any).findAll.mockResolvedValue(vehicles);

      const result = await service.findByOwner(1);

      expect((service as any).findAll).toHaveBeenCalledWith(
        { owner_id: 1 },
        undefined,
      );
      expect(result).toEqual(vehicles);
    });

    it('should throw NotFoundException when no vehicles found for owner', async () => {
      (service as any).findAll.mockResolvedValue([]);

      await expect(service.findByOwner(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateVehicleDto: UpdateVehicleDto = {
      name: 'Updated Hilux',
      year: 2021,
      fuel_capacity: 55,
      mpg: 30,
    };

    it('should update vehicle successfully when user is owner', async () => {
      const updatedVehicle = { ...mockVehicle, ...updateVehicleDto };

      // Mock the findOne method to return the mock vehicle
      service.findOne = jest.fn().mockResolvedValue(mockVehicle);
      repository.save.mockResolvedValue(updatedVehicle);

      const result = await service.update(1, updateVehicleDto, 1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedVehicle);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      service.findOne = jest.fn().mockResolvedValue(mockVehicle);

      await expect(service.update(1, updateVehicleDto, 999)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      service.findOne = jest.fn().mockRejectedValue(new NotFoundException());

      await expect(service.update(999, updateVehicleDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove vehicle successfully when user is owner', async () => {
      service.findOne = jest.fn().mockResolvedValue(mockVehicle);
      repository.remove.mockResolvedValue(mockVehicle);

      await service.remove(1, 1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(mockVehicle);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      service.findOne = jest.fn().mockResolvedValue(mockVehicle);

      await expect(service.remove(1, 999)).rejects.toThrow(ForbiddenException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      service.findOne = jest.fn().mockRejectedValue(new NotFoundException());

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
