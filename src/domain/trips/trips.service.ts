import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripsRepository } from './repository/trips.repository';
import { UpdateTripDto } from './dto/update-trip-dto';
import { Trip } from './entities/trip.entity';

//TODO: we aren't using UpdateTripDTO

@Injectable()
export class TripsService {
  constructor(private tripsRepository: TripsRepository) {}

  async create(createTripDto: any): Promise<any> {
    const trip = this.tripsRepository.create(createTripDto);
    return this.tripsRepository.save(trip);
  }

  async findOne(id: number): Promise<Trip> {
    const trip = await this.tripsRepository.findById(id);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }
    return trip;
  }

  async findByCreator(creatorId: number): Promise<Trip[]> {
    const trips = await this.tripsRepository.findByCreator(creatorId);
    if (!trips || trips.length === 0) {
      throw new NotFoundException(
        `No trips found for creator with ID ${creatorId}`,
      );
    }
    return trips;
  }

  async update(
    id: number,
    updateTripDto: Partial<Trip>,
    userId: number,
  ): Promise<Trip> {
    const trip = await this.findOne(id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to update this trip`,
      );
    }

    Object.assign(trip, updateTripDto);

    return this.tripsRepository.save(trip);
  }

  async remove(id: number, userId: number): Promise<void> {
    const trip = await this.findOne(id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        `You don't have permission to delete this trip`,
      );
    }

    await this.tripsRepository.remove(trip);
  }

  //TODO evaluate if below methods should be here or itinerary service
  //calculateTotalDistance
  //isUserInTrip
  //fullTripDetails
}
