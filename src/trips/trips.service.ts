import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {TripsRepository} from "./repository/trips.repository";
import {UpdateTripDto} from "./dto/update-trip-dto";
import {Trip} from "./entities/trip.entity";

@Injectable()
export class TripsService {

    constructor(
        private tripsRepository: TripsRepository,
    ) {}

    async create(createTripDto: any): Promise<any> {
        const trip = this.tripsRepository.create(createTripDto);
        return this.tripsRepository.save(trip);
    }

    async findOne(id: number): Promise<any> {
        const trip = await this.tripsRepository.findById(id);
        if (!trip) {
            throw new NotFoundException(`Trip with ID ${id} not found`);
        }
        return trip;
    }

    async update(id: number, updateTripDto: Partial<Trip>, userId: number): Promise<Trip> {
        const trip = await this.findOne(id);
        if (trip.creator_id !== userId) {
            throw new ForbiddenException(`You don't have permission to update this trip`);
        }

       Object.assign(trip, updateTripDto);

        return this.tripsRepository.save(trip);
    }

    async remove(id: number, userId: number): Promise<void> {
        const trip = await this.findOne(id);
        if (trip.creator_id !== userId) {
            throw new ForbiddenException(`You don't have permission to delete this trip`);
        }

        await this.tripsRepository.remove(trip);
    }

    //calculateTotalDistance
    //isUserInTrip
    //fullTripDetails
}
