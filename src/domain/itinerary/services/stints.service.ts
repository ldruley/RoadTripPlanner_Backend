import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStintDto } from '../dto/create-stint-dto';
import { Stint } from '../entities/stint.entity';
import { UpdateStintDto } from '../dto/update-sprint-dto';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class StintsService {
  constructor(
    @InjectRepository(Stint)
    private stintRepository: Repository<Stint>,
  ) {}

  /**
   * Find a stint by its ID
   * @param stint_id The stint ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The stint if found, or null if not found
   */
  async findById(stint_id: number, manager?: EntityManager): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    const stint = await repo.findOne({ where: { stint_id } });
    if (!stint) {
      throw new NotFoundException(`Stint with ID ${stint_id} not found`);
    }
    return stint;
  }

  /**
   * Find all stints in a trip
   * @param trip_id The trip ID
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of stints in the specified trip or empty array if not found
   */
  async findAllByTrip(
    trip_id: number,
    manager?: EntityManager,
  ): Promise<Stint[]> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    return repo.find({ where: { trip_id } });
  }

  //TODO: why are we pulling legs.start_stop seperately?
  /**
   * Find all stints in a trip with stops and legs
   * This involves a join with the legs and stops tables
   * @param trip_id The trip ID
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of stints in the specified trip or empty array if not found
   */
  async findAllByTripWithRelations(
    trip_id: number,
    manager?: EntityManager,
  ): Promise<Stint[]> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    return repo.find({
      where: { trip_id },
      relations: ['stops', 'legs', 'legs.start_stop', 'legs.end_stop'],
      order: { sequence_number: 'ASC' },
    });
  }

  /**
   * Create a new stint with basic metadata
   * @param createStintDto The stint data to create
   * @param manager Optional EntityManager for transaction handling
   * @returns The created stint
   */
  async create(
    createStintDto: CreateStintDto,
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    const stint = repo.create(createStintDto);
    return repo.save(stint);
  }

  //TODO: rework/eliminate
  /**
   * Update a stint by its ID
   * @param stint_id The stint ID
   * @param updateStintDto The updated stint data
   * @param userId The user ID of the trip creator
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated stint or null if not found
   */
  async update(
    stint_id: number,
    updateStintDto: UpdateStintDto,
    userId: number,
    manager?: EntityManager,
  ): Promise<Stint | null> {
    const stint = await this.findById(stint_id, manager);
    if (!stint) {
      return null;
    }
    Object.assign(stint, updateStintDto);

    return this.stintRepository.save(stint);
  }

  //TODO: update with consquence handling - this will likely run into foreign key issues
  /**
   * Remove a stint by its ID
   * @param stint_id The stint ID
   * @param userId The user ID of the trip creator
   * @param manager Optional EntityManager for transaction handling
   */
  async remove(
    stint_id: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    const stint = await this.findById(stint_id, manager);
    if (!stint) {
      //TODO: are we throwing an error here or elsewhere
      return;
    }
    if (stint.trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this stint`,
      );
    }

    await repo.remove(stint);
  }

  //TODO verify the sequence numbering works here
  /**
   * Calculate the next available sequence number for a stint in a trip
   * @param trip_id The trip ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The next sequence number
   */
  async getNextSequenceNumber(
    trip_id: number,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    const result: { maxSequence: string | null } | undefined = await repo
      .createQueryBuilder('stint')
      .select('MAX(stint.sequence_number)', 'maxSequence')
      .where('stint.trip_id = :trip_id', { trip_id })
      .getRawOne();

    return result?.maxSequence ? Number(result.maxSequence) + 1 : 0;
  }

  //TODO: This might be redudant with getNextSequenceNumber
  /**
   * Find the maximum sequence number for a trip
   * @param trip_id The trip ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The maximum sequence number, or 0 if no stints exist
   */
  async findMaxSequenceNumber(
    trip_id: number,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    const result: { maxSequence: string | null } | undefined = await repo
      .createQueryBuilder('stint')
      .select('MAX(stint.sequence_number)', 'maxSequence')
      .where('stint.trip_id = :trip_id', { trip_id })
      .getRawOne();

    return result?.maxSequence ? Number(result.maxSequence) : 0;
  }

  //TODO: Update methods - these are super redundant and need to be cleaned up

  /**
   * Update the continuation flag for a stint
   * @param stint The stint to update
   * @param continuesFromPrevious The new value for the continuation flag
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated stint
   */
  async setContinuesFromPrevious(
    stint: Stint,
    continuesFromPrevious: boolean,
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    stint.continues_from_previous = continuesFromPrevious;
    return repo.save(stint);
  }

  /**
   * Set stint timing properties
   * @param stint The stint to update
   * @param timing The new timing properties
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated stint
   */
  async updateTiming(
    stint: Stint,
    timing: { start_time?: Date; end_time?: Date },
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;

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
   * @param stint The stint to update
   * @param updateData The new metadata properties
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated stint
   * */
  async updateStintMetadata(
    stint: Stint,
    updateData: Partial<Stint>,
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    Object.assign(stint, updateData);
    return repo.save(stint);
  }

  /**
   * Update the start and end location references for a stint
   * @param stint The stint to update
   * @param updates The new location IDs
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated stint
   * */
  async updateLocationReferences(
    stint: Stint,
    updates: { start_location_id?: number; end_location_id?: number },
    manager?: EntityManager,
  ): Promise<Stint> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;

    if (updates.start_location_id) {
      stint.start_location_id = updates.start_location_id;
    }

    if (updates.end_location_id) {
      stint.end_location_id = updates.end_location_id;
    }

    return repo.save(stint);
  }
}
