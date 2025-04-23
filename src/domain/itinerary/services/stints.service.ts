import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStintDto } from '../dto/create-stint-dto';
import { StintsRepository } from '../repositories/stints.repository';
import { Stint } from '../entities/stint.entity';
import { UpdateStintDto } from '../dto/update-sprint-dto';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class StintsService {
  constructor(
    private stintsRepository: StintsRepository,
    private dataSource: DataSource,
  ) {}

  async create(createStintDto: CreateStintDto): Promise<any> {
    const stint = this.stintsRepository.create(createStintDto);
    return this.stintsRepository.save(stint);
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

  /**
   * Create a new stint with basic metadata
   */
  async createStint(
    createStintDto: CreateStintDto,
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintsRepository;
    const stint = repo.create(createStintDto);
    return repo.save(stint);
  }

  /**
   * Calculate the next available sequence number for a stint in a trip
   */
  async getNextSequenceNumber(tripId: number): Promise<number> {
    const maxSequence =
      await this.stintsRepository.findMaxSequenceNumber(tripId);
    return maxSequence + 1;
  }

  //TODO: rework/eliminate
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

  //TODO: update
  async remove(id: number, userId: number): Promise<void> {
    const stint = await this.findOne(id);
    if (stint.trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this stint`,
      );
    }

    await this.stintsRepository.remove(stint);
  }

  /**
   * Update the continuation flag for a stint
   */
  async setContinuesFromPrevious(
    stint: Stint,
    continuesFromPrevious: boolean,
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintsRepository;
    stint.continues_from_previous = continuesFromPrevious;
    return repo.save(stint);
  }

  /**
   * Set stint timing properties
   */
  async updateTiming(
    stint: Stint,
    timing: { start_time?: Date; end_time?: Date },
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintsRepository;

    if (timing.start_time !== undefined) {
      stint.start_time = timing.start_time;
    }

    if (timing.end_time !== undefined) {
      stint.end_time = timing.end_time;
    }

    return repo.save(stint);
  }

  /**
   * Update stint metadata
   * */
  async updateStintMetadata(
    stint: Stint,
    updateData: Partial<Stint>,
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintsRepository;
    Object.assign(stint, updateData);
    return repo.save(stint);
  }

  /**
   * Update the start and end location references for a stint
   * */
  async updateLocationReferences(
    stint: Stint,
    updates: { start_location_id?: number; end_location_id?: number },
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintsRepository;

    if (updates.start_location_id) {
      stint.start_location_id = updates.start_location_id;
    }

    if (updates.end_location_id) {
      stint.end_location_id = updates.end_location_id;
    }

    return repo.save(stint);
  }
}
