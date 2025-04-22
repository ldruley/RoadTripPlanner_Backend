import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStintDto } from '../dto/create-stint-dto';
import { StintsRepository } from '../repositories/stints.repository';
import { Stint } from '../entities/stint.entity';
import { UpdateStintDto } from '../dto/update-sprint-dto';
import { CreateStintWithStopDto } from '../dto/create-stint-with-stop.dto';
import { TripsService } from '../../trips/trips.service';
import { StopsService } from './stops.service';
import { DataSource } from 'typeorm';
import { Stop } from '../entities/stop.entity';
import { StopType } from '../../../common/enums';

@Injectable()
export class StintsService {
  constructor(
    private stintsRepository: StintsRepository,
    @Inject(forwardRef(() => TripsService))
    private tripsService: TripsService,
    @Inject(forwardRef(() => StopsService))
    private stopsService: StopsService,
    private dataSource: DataSource,
  ) {}

  async create(createStintDto: CreateStintDto): Promise<any> {
    const stint = this.stintsRepository.create(createStintDto);
    return this.stintsRepository.save(stint);
  }

  async createWithInitialStop(
    createStintWithStopDto: CreateStintWithStopDto,
    userId: number,
  ): Promise<Stint> {
    // Verify permissions
    const trip = await this.tripsService.findOne(
      createStintWithStopDto.trip_id,
    );
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create stints in this trip',
      );
    }

    // Use transaction to ensure both stop and stint are created or neither is
    return this.dataSource.transaction(async (manager) => {
      // 1. Create the initial stop first
      const stopToCreate = {
        name: createStintWithStopDto.initialStop.name,
        latitude: createStintWithStopDto.initialStop.latitude,
        longitude: createStintWithStopDto.initialStop.longitude,
        address: createStintWithStopDto.initialStop.address,
        stop_type:
          createStintWithStopDto.initialStop.stopType || StopType.PITSTOP,
        sequence_number: 1, // First stop in the stint
        notes: createStintWithStopDto.initialStop.notes,
        trip_id: createStintWithStopDto.trip_id,
        stint_id: null, // We'll update this after creating the stint
      };

      const stop = await this.stopsService.createWithTransaction(
        stopToCreate,
        manager,
      );

      // 2. Now create the stint with the stop_id already available
      const stintToCreate = {
        name: createStintWithStopDto.name,
        sequence_number: createStintWithStopDto.sequence_number,
        trip_id: createStintWithStopDto.trip_id,
        notes: createStintWithStopDto.notes,
        start_location_id: stop.stop_id, // Use the new stop's ID
      };

      const stintRepo = manager.getRepository(Stint);
      const stint = stintRepo.create(stintToCreate);
      const savedStint = await stintRepo.save(stint);

      // 3. Update the stop with the stint_id
      stop.stint_id = savedStint.stint_id;
      await manager.getRepository(Stop).save(stop);

      return savedStint;
    });
  }

  async findOne(id: number): Promise<Stint> {
    const stint = await this.stintsRepository.findById(id);
    if (!stint) {
      throw new NotFoundException(`Stint with ID ${id} not found`);
    }
    return stint;
  }

  async findAllByTrip(trip_id: number): Promise<Stint[]> {
    const stints = await this.stintsRepository.findAllByTrip(trip_id);
    if (!stints || stints.length === 0) {
      throw new NotFoundException(
        `No stints found for trip with ID ${trip_id}`,
      );
    }
    return stints;
  }

  async update(
    id: number,
    updateStintDto: UpdateStintDto,
    userId: number,
  ): Promise<Stint> {
    const stint = await this.findOne(id);
    if (stint.trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to update this stint`,
      );
    }

    Object.assign(stint, updateStintDto);

    return this.stintsRepository.save(stint);
  }

  async remove(id: number, userId: number): Promise<void> {
    const stint = await this.findOne(id);
    if (stint.trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this stint`,
      );
    }

    await this.stintsRepository.remove(stint);
  }
}
