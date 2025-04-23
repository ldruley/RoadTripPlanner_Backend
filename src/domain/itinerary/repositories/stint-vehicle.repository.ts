// src/domain/itinerary/repositories/stint-vehicle.repository.ts

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StintVehicle } from '../entities/stint-vehicle.entity';

@Injectable()
export class StintVehicleRepository extends Repository<StintVehicle> {
  constructor(private dataSource: DataSource) {
    super(StintVehicle, dataSource.createEntityManager());
  }

  findByStint(stint_id: number): Promise<StintVehicle[]> {
    return this.find({ where: { stint_id } });
  }

  findByVehicle(vehicle_id: number): Promise<StintVehicle[]> {
    return this.find({ where: { vehicle_id } });
  }

  findByDriver(driver_id: number): Promise<StintVehicle[]> {
    return this.find({ where: { driver_id } });
  }

  findByStintAndVehicle(
    stint_id: number,
    vehicle_id: number,
  ): Promise<StintVehicle | null> {
    return this.findOne({ where: { stint_id, vehicle_id } });
  }
}
