import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle-dto';
import { Vehicle } from './entities/vehicle.entity';
import { UpdateVehicleDto } from './dto/update-vehicle-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  /**
   * Create a new vehicle
   * @param createVehicleDto The vehicle data to create
   * @returns The created vehicle
   */
  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  /**
   * Find a vehicle by its ID
   * @param id The vehicle ID
   * @returns The vehicle if found, or null if not found
   */
  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { vehicle_id: id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  /**
   * Find all vehicles owned by a specific owner
   * @param ownerId The owner ID
   * @returns An array of vehicles owned by the specified owner
   */
  async findByOwner(ownerId: number): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepository.find({
      where: { owner_id: ownerId },
    });

    if (!vehicles || vehicles.length === 0) {
      throw new NotFoundException(
        `No vehicles found for owner with ID ${ownerId}`,
      );
    }

    return vehicles;
  }

  /**
   * Update a vehicle
   * @param id The vehicle ID
   * @param updateVehicleDto The vehicle data to update
   * @param userId The ID of the user making the request
   * @returns The updated vehicle
   */
  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
    userId: number,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (vehicle.owner_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to update this vehicle`,
      );
    } else if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    Object.assign(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  /**
   * Remove a vehicle
   * @param id The vehicle ID
   * @param userId The ID of the user making the request
   */
  async remove(id: number, userId: number): Promise<void> {
    const vehicle = await this.findOne(id);
    if (vehicle.owner_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this vehicle`,
      );
    }

    await this.vehicleRepository.remove(vehicle);
  }
}
