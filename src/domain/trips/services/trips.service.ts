import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Trip } from '../entities/trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseService } from '../../../common/services/base.service';
import { CreateTripDto } from '../dto/create-trip.dto';

//TODO: we aren't using UpdateTripDTO

@Injectable()
export class TripsService extends BaseService<Trip> {
  constructor(
    @InjectRepository(Trip)
    repo: Repository<Trip>,
  ) {
    super(Trip, repo);
  }

  //TODO: any
  /**
   * Create a new trip
   * @param createTripDto The trip data to create
   * @param manager Optional EntityManager for transaction handling
   * @returns The created trip
   */
  async create(createTripDto: any, manager?: EntityManager): Promise<any> {
    const repo = this.getRepo(manager);
    const trip = repo.create(createTripDto);
    return repo.save(trip);
  }

  /*async createTrip(createTripDto: any, manager?: EntityManager): Promise<Trip> {
    return this.create(createTripDto, manager);
  }*/

  /**
   * Find a trip by its ID
   * @param trip_id The trip ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The trip if found, or throws an error if not found
   */
  async findOne(trip_id: number, manager?: EntityManager): Promise<Trip> {
    return this.findOneOrThrow({ trip_id }, manager);
  }

  /**
   * Find trips by creator ID
   * @param creator_id The ID of the trip creator
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of trips or null if no trips are found
   */
  async findByCreator(
    creator_id: number,
    manager?: EntityManager,
  ): Promise<Trip[] | null> {
    return this.findAll({ creator_id }, manager);
  }

  /**
   * Update a trip
   * @param id The trip ID
   * @param updateTripDto The trip data to update
   * @param userId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated trip
   */
  async update(
    id: number,
    updateTripDto: Partial<Trip>,
    userId: number,
    manager?: EntityManager,
  ): Promise<Trip> {
    const repo = this.getRepo(manager);
    const trip = await this.findOne(id);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to update this trip`,
      );
    }

    Object.assign(trip, updateTripDto);
    return repo.save(trip);
  }

  /**
   * Delete a trip
   * @param tripId The trip ID
   * @param userId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   * @returns void
   */
  async remove(
    tripId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const trip = await this.findOneOrThrow({ trip_id: tripId }, manager);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this trip`,
      );
    }
    await this.delete({ trip_id: tripId }, manager);
  }

  //TODO: this might not be needed with the new trip-participant service
  /**
   * Check if a user is in a trip
   * @param trip_id The trip ID
   * @param user_id The user ID
   * @param manager Optional EntityManager for transaction handling
   * @returns True if the user is in the trip, false otherwise
   */
  async checkUserInTrip(
    trip_id: number,
    user_id: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.exists({ trip_id, creator_id: user_id }, manager);
  }

  //TODO evaluate if below methods should be here or itinerary service
  //calculateTotalDistance
  //isUserInTrip
  //fullTripDetails
}
