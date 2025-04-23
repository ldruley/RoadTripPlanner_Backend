import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StopsRepository } from '../repositories/stops.repository';
import { TripsService } from '../../trips/trips.service';
import { StintsService } from './stints.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { Stop } from '../entities/stop.entity';
import { UpdateStopDto } from '../dto/update-stop.dto';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { StopType } from '../../../common/enums';

@Injectable()
export class StopsService {
  constructor(
    private stopsRepository: StopsRepository,
    @Inject(forwardRef(() => TripsService))
    private tripsService: TripsService,
    @Inject(forwardRef(() => StintsService))
    private stintsService: StintsService,
  ) {}

  async create(createStopDto: CreateStopDto, userId: number): Promise<Stop> {
    const trip = await this.tripsService.findOne(createStopDto.trip_id);
    if (!trip) {
      throw new NotFoundException(
        `Trip with ID ${createStopDto.trip_id} not found`,
      );
    }
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add stops to this trip',
      );
    }

    const stint = await this.stintsService.findOne(createStopDto.stint_id);
    if (!stint) {
      throw new NotFoundException(
        `Stint with ID ${createStopDto.stint_id} not found`,
      );
    }
    if (stint.trip_id !== createStopDto.trip_id) {
      throw new ForbiddenException(
        'The stint does not belong to the specified trip',
      );
    }

    const stop = this.stopsRepository.create(createStopDto);
    const savedStop = await this.stopsRepository.save(stop);

    //TODO: need to handle legs here

    return savedStop;
  }

  //using this method so we can ensure that the stop is created in same transaction
  async createWithTransaction(
    stopData: {
      name: string;
      latitude: number;
      longitude: number;
      address: string | undefined;
      stop_type: StopType;
      sequence_number: number;
      notes: string | undefined;
      trip_id: number;
      stint_id: null;
    },
    manager: EntityManager,
  ): Promise<Stop> {
    const stopRepo = manager.getRepository(Stop);
    // @ts-expect-error we testing
    const stop = stopRepo.create(stopData);
    // @ts-expect-error we testing
    return stopRepo.save(stop);
  } //TODO fix typescript errors

  /**
   * Shift all stops in a stint with sequence numbers >= startSequence by offset
   */
  async shiftStopSequences(
    stintId: number,
    startSequence: number,
    offset: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Stop) : this.stopsRepository;

    const stopsToShift = await repo.find({
      where: {
        stint_id: stintId,
        sequence_number: MoreThanOrEqual(startSequence),
      },
      order: { sequence_number: 'ASC' },
    });

    for (const stop of stopsToShift) {
      stop.sequence_number += offset;
      await repo.save(stop);
    }
  }

  /**
   * Add a stop with sequence handling
   * Validation and other handling must be done in itinerary service
   */
  async addStopToStint(
    createStopDto: CreateStopDto,
    userId: number,
    manager?: EntityManager,
  ): Promise<Stop> {
    // Domain validation
    //TODO: ensure validation in itinerary
    //await this.validateStopAddition(createStopDto, userId);

    const repo = manager ? manager.getRepository(Stop) : this.stopsRepository;
    const maxSequence = await this.stopsRepository.findMaxSequenceNumber(
      createStopDto.stint_id,
    );

    // Sequence logic
    if (
      !createStopDto.sequence_number ||
      createStopDto.sequence_number === 0 ||
      createStopDto.sequence_number > maxSequence + 1
    ) {
      createStopDto.sequence_number = maxSequence + 1;
    } else {
      // Shift existing stops if necessary
      await this.shiftStopSequences(
        createStopDto.stint_id,
        createStopDto.sequence_number,
        1,
        manager,
      );
    }

    // Create the stop
    const stop = repo.create(createStopDto);
    return repo.save(stop);
  }

  /**
   * Remove a stop with sequence handling
   * Validation and other handling must be done in itinerary service
   */
  async removeStopFromStint(
    stopId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<Stop> {
    // Domain validation...

    const repo = manager ? manager.getRepository(Stop) : this.stopsRepository;
    const stop = await this.findOne(stopId);

    // Remove the stop
    const removedStop = await repo.remove(stop);

    // Shift sequence numbers down
    await this.shiftStopSequences(
      stop.stint_id,
      stop.sequence_number + 1,
      -1,
      manager,
    );

    return removedStop;
  }

  async findOne(id: number): Promise<Stop> {
    const stop = await this.stopsRepository.findById(id);
    if (!stop) {
      throw new NotFoundException(`Stop with ID ${id} not found`);
    }
    return stop;
  }

  async findAllByTrip(trip_id: number): Promise<Stop[]> {
    const stops = await this.stopsRepository.findAllByTrip(trip_id);
    if (!stops || stops.length === 0) {
      throw new NotFoundException(`No stops found for trip with ID ${trip_id}`);
    }
    return stops;
  }

  async findAllByStint(stint_id: number): Promise<Stop[]> {
    const stops = await this.stopsRepository.findByStint(stint_id);
    if (!stops || stops.length === 0) {
      throw new NotFoundException(
        `No stops found for stint with ID ${stint_id}`,
      );
    }
    return stops;
  }

  async update(
    id: number,
    updateStopDto: UpdateStopDto,
    userId: number,
  ): Promise<Stop> {
    const stop = await this.findOne(id);

    const trip = await this.tripsService.findOne(stop.trip_id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this stop',
      );
    }
    const stint = await this.stintsService.findOne(stop.stint_id);
    if (updateStopDto.stint_id && updateStopDto.stint_id !== stop.stint_id) {
      const newStint = await this.stintsService.findOne(updateStopDto.stint_id);
      if (newStint.trip_id !== stop.trip_id) {
        throw new ForbiddenException(
          'The new stint must belong to the same trip',
        );
      }
    }

    Object.assign(stop, updateStopDto);
    const updatedStop = await this.stopsRepository.save(stop);

    // TODO: if sequence_number is changed - handle legs

    return updatedStop;
  }

  async remove(id: number, userId: number): Promise<void> {
    const stop = await this.findOne(id);
    const trip = await this.tripsService.findOne(stop.trip_id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this stop',
      );
    }

    await this.stopsRepository.remove(stop);
  }
}
