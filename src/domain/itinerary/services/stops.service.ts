import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStopDto } from '../dto/create-stop.dto';
import { Stop } from '../entities/stop.entity';
import { EntityManager, MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationsService } from '../../locations/locations.service';

@Injectable()
export class StopsService {
  constructor(
    @InjectRepository(Stop)
    private stopRepository: Repository<Stop>,
    private locationsService: LocationsService,
  ) {}

  /**
   * Find a stop by its ID
   * @param stop_id
   * @param manager Optional EntityManager for transaction handling
   * @returns The stop if found, or null if not found
   */
  async findById(stop_id: number, manager?: EntityManager): Promise<Stop> {
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;
    const stop = await repo.findOne({ where: { stop_id } });
    if (!stop) {
      throw new NotFoundException(`Stop with ID ${stop_id} not found`);
    }
    return stop;
  }

  /**
   * Find all stops in a trip
   * @param trip_id
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of stops in the specified trip or null if not found
   */
  async findAllByTrip(
    trip_id: number,
    manager?: EntityManager,
  ): Promise<Stop[] | null> {
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;
    return repo.find({ where: { trip_id } });
  }

  /**
   * Find all stops in a stint
   * @param stint_id
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of stops in the specified stint or null if not found
   */
  async findAllByStint(
    stint_id: number,
    manager?: EntityManager,
  ): Promise<Stop[] | null> {
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;
    return repo.find({
      where: { stint_id },
      order: { sequence_number: 'ASC' },
    });
  }

  /**
   * Add a stop with location integration and sequence handling
   * Validation and other handling must be done in itinerary service
   * @param createStopDto The DTO containing stop data
   * @param userId The ID of the user creating the stop
   * @param manager Optional EntityManager for transaction handling
   * @returns The created stop
   */
  async create(
    createStopDto: CreateStopDto,
    userId: number,
    manager?: EntityManager,
  ): Promise<Stop> {
    // Domain validation
    //TODO: ensure validation in itinerary
    //await this.validateStopAddition(createStopDto, userId);

    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;
    const maxSequence = await this.findMaxSequenceNumber(
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

    //TODO: We should create locations via api and generally not here
    let location = await this.locationsService.findByCoordinates(
      createStopDto.latitude,
      createStopDto.longitude,
    );
    if (!location) {
      location = await this.locationsService.create({
        name: createStopDto.name,
        latitude: createStopDto.latitude,
        longitude: createStopDto.longitude,
        address: createStopDto.address,
        city: createStopDto.city,
        state: createStopDto.state,
        country: createStopDto.country,
        postal_code: createStopDto.postal_code,
        external_source: 'user',
      });
    }
    createStopDto.location_id = location.location_id;
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
  ): Promise<Stop | null> {
    // Domain validation...

    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;
    const stop = await this.findById(stopId);
    if (!stop) {
      return null;
    }
    const { stint_id, sequence_number } = stop;
    // Remove the stop
    const removedStop = await repo.findOne({ where: { stop_id: stopId } });

    // Shift sequence numbers down
    await this.shiftStopSequences(stint_id, sequence_number + 1, -1, manager);

    return removedStop;
  }

  async getStopWithOffset(
    stint_id: number,
    sequence_number: number,
    offset: number,
    manager?: EntityManager,
  ): Promise<Stop | null> {
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;
    return repo.findOne({
      where: { stint_id, sequence_number: sequence_number + offset },
    });
  }

  async countByStint(
    stint_id: number,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;
    return await repo.count({ where: { stint_id } });
  }

  /**
   * Shift all stops in a stint with sequence numbers >= startSequence by offset
   * @param stintId The stint ID
   * @param startSequence The starting sequence number
   * @param offset The offset to shift by (positive or negative)
   * @param manager Optional EntityManager for transaction handling
   */
  async shiftStopSequences(
    stintId: number,
    startSequence: number,
    offset: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;

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
   * Find the maximum sequence number for stops in a stint
   * @param stint_id The stint ID
   * @returns The maximum sequence number, or 0 if no stops exist
   */
  async findMaxSequenceNumber(stint_id: number): Promise<number> {
    const result: { maxSequence: string | null } | undefined =
      await this.stopRepository
        .createQueryBuilder('stop')
        .select('MAX(stop.sequence_number)', 'maxSequence')
        .where('stop.stint_id = :stint_id', { stint_id })
        .getRawOne();

    return result?.maxSequence ? Number(result.maxSequence) : 0;
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
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;

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

  async getStintEnd(stintId: number, manager?: EntityManager): Promise<Stop> {
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;

    const maxSequence = await this.findMaxSequenceNumber(stintId);
    const endStop = await repo.findOne({
      where: {
        sequence_number: maxSequence,
        stint_id: stintId,
      },
    });
    if (!endStop) {
      throw new NotFoundException(`End stop for stint ${stintId} not found`);
    }
    return endStop;
  }

  async sumDuration(stintId: number, manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(Stop) : this.stopRepository;
    const result: { total: number } | undefined = await repo
      .createQueryBuilder('stop')
      .select('SUM(stop.duration)', 'total')
      .where('stop.stint_id = :stint_id', { stint_id: stintId })
      .getRawOne();

    return result?.total ? Number(result.total) : 0;
  }
}
