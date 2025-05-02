import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle-dto';
import { Vehicle } from './entities/vehicle.entity';
import { UpdateVehicleDto } from './dto/update-vehicle-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';

@Injectable()
export class VehiclesService extends BaseService<Vehicle> {
  constructor(
    @InjectRepository(Vehicle)
    private repo: Repository<Vehicle>,
  ) {
    super(Vehicle, repo);
  }

  /**
   * Create a new vehicle
   * @param createVehicleDto The vehicle data to create
   * @param manager Optional EntityManager for transaction handling
   * @returns The created vehicle
   */
  async create(
    createVehicleDto: CreateVehicleDto,
    manager?: EntityManager,
  ): Promise<Vehicle> {
    const repo = this.getRepo(manager);
    const vehicle = repo.create(createVehicleDto);
    return repo.save(vehicle);
  }

  /**
   * Find a vehicle by its ID
   * @param id The vehicle ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The vehicle if found, or null if not found
   */
  async findOne(id: number, manager?: EntityManager): Promise<Vehicle> {
    return this.findOneOrThrow({ vehicle_id: id }, manager);
  }

  /**
   * Find all vehicles owned by a specific owner
   * @param ownerId The owner ID
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of vehicles owned by the specified owner
   */
  async findByOwner(
    ownerId: number,
    manager?: EntityManager,
  ): Promise<Vehicle[]> {
    return this.findAll({ owner_id: ownerId }, manager);
  }

  /**
   * Update a vehicle
   * @param id The vehicle ID
   * @param updateVehicleDto The vehicle data to update
   * @param userId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated vehicle
   */
  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
    userId: number,
    manager?: EntityManager,
  ): Promise<Vehicle> {
    const repo = this.getRepo(manager);
    const vehicle = await this.findOne(id);
    if (vehicle.owner_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to update this vehicle`,
      );
    }

    Object.assign(vehicle, updateVehicleDto);
    return repo.save(vehicle);
  }

  /**
   * Remove a vehicle
   * @param id The vehicle ID
   * @param userId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   */
  async remove(
    id: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);
    const vehicle = await this.findOne(id);
    if (vehicle.owner_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this vehicle`,
      );
    }

    await repo.remove(vehicle);
  }
}
