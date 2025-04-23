import { Injectable, NotFoundException } from '@nestjs/common';
import { StopsRepository } from '../repositories/stops.repository';
import { CreateStopDto } from '../dto/create-stop.dto';
import { Stop } from '../entities/stop.entity';
import { EntityManager, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class StopsService {
  constructor(private stopsRepository: StopsRepository) {}

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
  async create(
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
  async delete(
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

  /**
   * Get the start and end location IDs for a stint
   */
  async getStintEdges(
    stintId: number,
    manager?: EntityManager,
  ): Promise<{
    start_location_id: number | undefined;
    end_location_id: number | undefined;
  }> {
    const repo = manager ? manager.getRepository(Stop) : this.stopsRepository;

    const startStop = await repo
      .createQueryBuilder('stop')
      .select('stop_id', 'id')
      .where('stint_id = :stintId', { stintId })
      .orderBy('sequence_number', 'ASC')
      .limit(1)
      .getRawOne<{ id: number }>();

    const endStop = await repo
      .createQueryBuilder('stop')
      .select('stop_id', 'id')
      .where('stint_id = :stintId', { stintId })
      .orderBy('sequence_number', 'DESC')
      .limit(1)
      .getRawOne<{ id: number }>();

    return {
      start_location_id: startStop?.id ?? undefined,
      end_location_id: endStop?.id ?? undefined,
    };
  }
}
