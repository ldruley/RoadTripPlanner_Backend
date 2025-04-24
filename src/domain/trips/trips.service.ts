import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Trip } from './entities/trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

//TODO: we aren't using UpdateTripDTO

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
  ) {}

  //TODO: any
  /**
   * Create a new trip
   * @param createTripDto The trip data to create
   * @param manager Optional EntityManager for transaction handling
   * @returns The created trip
   */
  async create(createTripDto: any, manager?: EntityManager): Promise<any> {
    const repo = manager ? manager.getRepository(Trip) : this.tripRepository;
    const trip = repo.create(createTripDto);
    return repo.save(trip);
  }

  /**
   * Find a trip by its ID
   * @param trip_id The trip ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The trip if found, or throws an error if not found
   */
  async findOne(trip_id: number, manager?: EntityManager): Promise<Trip> {
    const repo = manager ? manager.getRepository(Trip) : this.tripRepository;
    const trip = await repo.findOne({ where: { trip_id } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${trip_id} not found`);
    }
    return trip;
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
    const repo = manager ? manager.getRepository(Trip) : this.tripRepository;
    const trips = await repo.find({ where: { creator_id } });
    if (!trips || trips.length === 0) {
      return null;
    }
    return trips;
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
    const repo = manager ? manager.getRepository(Trip) : this.tripRepository;
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
   * @param id The trip ID
   * @param userId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   * @returns void
   */
  async remove(
    id: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Trip) : this.tripRepository;
    const trip = await this.findOne(id);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this trip`,
      );
    }

    await repo.remove(trip);
  }

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
    const trip = await this.findOne(trip_id, manager);
    if (trip.creator_id === user_id) {
      return true;
    }
    return false;
  }

  //TODO evaluate if below methods should be here or itinerary service
  //calculateTotalDistance
  //isUserInTrip
  //fullTripDetails
}
