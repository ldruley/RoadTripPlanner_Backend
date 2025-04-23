import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { StintVehicleRepository } from '../repositories/stint-vehicle.repository';
import { StintVehicle } from '../entities/stint-vehicle.entity';
import { StintsService } from './stints.service';
import { VehiclesService } from '../../vehicles/vehicles.service';
import { UsersService } from '../../users/users.service';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { CreateStintVehicleDto } from '../dto/create-stint-vehicle.dto';
import { UpdateStintVehicleDto } from '../dto/update-stint-vehicle.dto';

@Injectable()
export class StintVehicleService {
  constructor(
    private stintVehicleRepository: StintVehicleRepository,
    private stintsService: StintsService,
    private vehiclesService: VehiclesService,
    private usersService: UsersService,
  ) {}

  async assignVehicle(
    createStintVehicleDto: CreateStintVehicleDto,
    requesterId: number,
  ): Promise<StintVehicle> {
    // Check if the stint exists
    const stint = await this.stintsService.findOne(
      createStintVehicleDto.stint_id,
    );

    // Check if requester has permission
    if (stint.trip.creator_id !== requesterId) {
      throw new ForbiddenException('Only the trip creator can assign vehicles');
    }

    // Check if the vehicle exists
    const vehicle = await this.vehiclesService.findOne(
      createStintVehicleDto.vehicle_id,
    );
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check if driver exists (if provided)
    if (createStintVehicleDto.driver_id) {
      const driver = await this.usersService.findOne(
        createStintVehicleDto.driver_id,
      );
      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
    }

    // Check if vehicle is already assigned to this stint
    const existingAssignment =
      await this.stintVehicleRepository.findByStintAndVehicle(
        createStintVehicleDto.stint_id,
        createStintVehicleDto.vehicle_id,
      );
    if (existingAssignment) {
      throw new ConflictException('Vehicle is already assigned to this stint');
    }

    // Create a new vehicle assignment
    const stintVehicle = this.stintVehicleRepository.create(
      createStintVehicleDto,
    );

    return this.stintVehicleRepository.save(stintVehicle);
  }

  async findByStint(stintId: number): Promise<StintVehicle[]> {
    return this.stintVehicleRepository.findByStint(stintId);
  }

  //TODO: Use a DTO for this if we can
  //TODO: This is scuffed, I'm tired, disabling
  //TODO: completely forgot what I was doing, we need to properly search for old vehicle and then assign new values
  /*async updateDriver(
    updateStintVehicleDto: UpdateStintVehicleDto,
    requesterId: number,
  ): Promise<StintVehicle> {
    // Check if the stint exists
    const stint = await this.stintsService.findOne(
      updateStintVehicleDto.stint_id,
    );
    if (!stint) {
      throw new NotFoundException('Stint not found');
    }

    // Check if requester has permission
    if (stint.trip.creator_id !== requesterId) {
      throw new ForbiddenException('Only the trip creator can update drivers');
    }

    // Find the vehicle assignment
    const stintVehicle =
      await this.stintVehicleRepository.findByStintAndVehicle(
        updateStintVehicleDto.stint_id,
        updateStintVehicleDto.vehicle_id,
      );
    if (!stintVehicle) {
      throw new NotFoundException('Vehicle assignment not found');
    }

    // Check if driver exists (if provided)
    if (updateStintVehicleDto.driver_id) {
      const newDriver = await this.usersService.findOne(
        updateStintVehicleDto.driver_id,
      );
      if (!newDriver) {
        throw new NotFoundException('Driver not found');
      }
    }

    // Update driver
    stintVehicle.driver_id = newDriverId;
    return this.stintVehicleRepository.save(stintVehicle);
  }*/

  async removeVehicle(
    stintId: number,
    vehicleId: number,
    requesterId: number,
  ): Promise<void> {
    // Check if the stint exists
    const stint = await this.stintsService.findOne(stintId);
    if (!stint) {
      throw new NotFoundException('Stint not found');
    }

    // Check if requester has permission
    if (stint.trip.creator_id !== requesterId) {
      throw new ForbiddenException('Only the trip creator can remove vehicles');
    }

    // Find the vehicle assignment
    const stintVehicle =
      await this.stintVehicleRepository.findByStintAndVehicle(
        stintId,
        vehicleId,
      );
    if (!stintVehicle) {
      throw new NotFoundException('Vehicle assignment not found');
    }

    await this.stintVehicleRepository.remove(stintVehicle);
  }
}
