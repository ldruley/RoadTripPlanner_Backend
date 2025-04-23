import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Trip } from './entities/trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

//TODO: we aren't using UpdateTripDTO

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
  ) {}

  /**
   * Create a new trip
   * @param createTripDto The trip data to create
   * @returns The created trip
   */
  async create(createTripDto: any): Promise<any> {
    const trip = this.tripRepository.create(createTripDto);
    return this.tripRepository.save(trip);
  }

  /**
   * Find a trip by its ID
   * @param trip_id The trip ID
   * @returns The trip if found, or null if not found
   */
  async findOne(trip_id: number): Promise<Trip | null> {
    const trip = await this.tripRepository.findOne({ where: { trip_id } });
    if (!trip) {
      return null;
    }
    return trip;
  }

  /**
   * Find trips by creator ID
   * @param creator_id The ID of the trip creator
   * @returns An array of trips or null if no trips are found
   */
  async findByCreator(creator_id: number): Promise<Trip[] | null> {
    const trips = await this.tripRepository.find({ where: { creator_id } });
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
   * @returns The updated trip
   */
  async update(
    id: number,
    updateTripDto: Partial<Trip>,
    userId: number,
  ): Promise<Trip> {
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

    return this.tripRepository.save(trip);
  }

  /**
   * Delete a trip
   * @param id The trip ID
   * @param userId The ID of the user making the request
   * @returns void
   */
  async remove(id: number, userId: number): Promise<void> {
    const trip = await this.findOne(id);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this trip`,
      );
    }

    await this.tripRepository.remove(trip);
  }

  //TODO evaluate if below methods should be here or itinerary service
  //calculateTotalDistance
  //isUserInTrip
  //fullTripDetails
}
