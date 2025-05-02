import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { StintsService } from './stints.service';
import { VehiclesService } from '../../vehicles/vehicles.service';
import { UsersService } from '../../users/users.service';
import { CreateStintVehicleDto } from '../dto/create-stint-vehicle.dto';
import { UpdateStintVehicleDto } from '../dto/update-stint-vehicle.dto';
import { BaseService } from '../../../common/services/base.service';
import { StintVehicle } from '../entities/stint-vehicle.entity';

@Injectable()
export class StintVehicleService extends BaseService<StintVehicle> {
  constructor(
    @InjectRepository(StintVehicle)
    repo: Repository<StintVehicle>,
    private readonly stintsService: StintsService,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
  ) {
    super(StintVehicle, repo);
  }

  /**
   * Assign a vehicle to a stint
   * @param createStintVehicleDto The DTO containing assignment data
   * @param requesterId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   * @returns The created StintVehicle entity
   */
  async assignVehicle(
    createStintVehicleDto: CreateStintVehicleDto,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<StintVehicle> {
    const repo = this.getRepo(manager);

    // Check if the stint exists
    const stint = await this.stintsService.findByIdWithRelationsOrThrow(
      createStintVehicleDto.stint_id,
      manager,
    );

    // Check if requester has permission (is creator of the trip)
    //TODO: need new permission check
    // if (stint.trip.creator_id !== requesterId) {
    //  throw new ForbiddenException('Only the trip creator can assign vehicles');
    //}

    // Check if the vehicle exists
    await this.vehiclesService.findOne(
      createStintVehicleDto.vehicle_id,
      manager,
    );

    // Check if driver exists (if provided)
    if (createStintVehicleDto.driver_id) {
      await this.usersService.findOne(createStintVehicleDto.driver_id, manager);
    }

    // Check if vehicle is already assigned to this stint
    const existingAssignment = await this.findOneOrNull(
      {
        stint_id: createStintVehicleDto.stint_id,
        vehicle_id: createStintVehicleDto.vehicle_id,
      },
      manager,
    );

    if (existingAssignment) {
      throw new ConflictException('Vehicle is already assigned to this stint');
    }

    // Create a new vehicle assignment
    const vehicleAssignment = repo.create(createStintVehicleDto);
    return repo.save(vehicleAssignment);
  }

  /**
   * Find all vehicles assigned to a stint
   * @param stintId The stint ID
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of StintVehicle entities
   */
  async findByStint(
    stintId: number,
    manager?: EntityManager,
  ): Promise<StintVehicle[]> {
    return this.findAll({ stint_id: stintId }, manager);
  }

  /**
   * Update the driver for a vehicle assignment
   * @param updateStintVehicleDto The DTO containing update data
   * @param requesterId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated StintVehicle entity
   */
  async updateDriver(
    updateStintVehicleDto: UpdateStintVehicleDto,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<StintVehicle> {
    // Check if the stint exists
    const stint = await this.stintsService.findByIdWithRelationsOrThrow(
      updateStintVehicleDto.stint_id,
      manager,
    );

    // Check if requester has permission
    // if (stint.trip.creator_id !== requesterId) {
    //  throw new ForbiddenException('Only the trip creator can update drivers');
    //}

    // Find the vehicle assignment
    const stintVehicle = await this.findOneOrThrow(
      {
        stint_id: updateStintVehicleDto.stint_id,
        vehicle_id: updateStintVehicleDto.vehicle_id,
      },
      manager,
    );

    // Check if driver exists (if provided)
    if (updateStintVehicleDto.driver_id) {
      await this.usersService.findOne(updateStintVehicleDto.driver_id, manager);
    } else {
      throw new BadRequestException('Driver ID is required');
    }

    // Update driver
    stintVehicle.driver_id = updateStintVehicleDto.driver_id;
    return this.save(stintVehicle, manager);
  }

  /**
   * Remove a vehicle assignment
   * @param stintId The stint ID
   * @param vehicleId The vehicle ID
   * @param requesterId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   */
  async removeVehicle(
    stintId: number,
    vehicleId: number,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<void> {
    // Check if the stint exists
    const stint = await this.stintsService.findByIdWithRelationsOrThrow(
      stintId,
      manager,
    );

    // Check if requester has permission
    // if (stint.trip.creator_id !== requesterId) {
    //   throw new ForbiddenException('Only the trip creator can remove vehicles');
    //  }

    // Find the vehicle assignment
    await this.findOneOrThrow(
      { stint_id: stintId, vehicle_id: vehicleId },
      manager,
    );

    await this.delete({ stint_id: stintId, vehicle_id: vehicleId }, manager);
  }

  /**
   * Find all stints with a specific vehicle assigned
   * @param vehicleId The vehicle ID
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of StintVehicle entities
   */
  async findByVehicle(
    vehicleId: number,
    manager?: EntityManager,
  ): Promise<StintVehicle[]> {
    return this.findAll({ vehicle_id: vehicleId }, manager);
  }

  /**
   * Check if a vehicle is assigned to a stint
   * @param vehicleId The vehicle ID
   * @param stintId The stint ID to check against
   * @param manager Optional EntityManager for transaction handling
   * @returns Boolean indicating if the vehicle is assigned to that stint
   */
  async isVehicleAssigned(
    vehicleId: number,
    stintId: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.exists({ vehicle_id: vehicleId, stint_id: stintId }, manager);
  }
}
