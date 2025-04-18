import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {StopsRepository} from "./repository/stops.repository";
import {TripsService} from "../trips/trips.service";
import {StintsService} from "../stints/stints.service";
import {CreateStopDto} from "./dto/create-stop.dto";
import {Stop} from "./entities/stop.entity";
import {UpdateStopDto} from "./dto/update-stop.dto";
import {EntityManager} from "typeorm";

@Injectable()
export class StopsService {

    constructor(
        private stopsRepository: StopsRepository,
        private tripsService: TripsService,
        private stintsService: StintsService
    ) {
    }

    async create(createStopDto: CreateStopDto, userId: number): Promise<Stop> {
        const trip = await this.tripsService.findOne(createStopDto.trip_id);
        if (!trip) {
            throw new NotFoundException(`Trip with ID ${createStopDto.trip_id} not found`);
        }
        if (trip.creator_id !== userId) {
            throw new ForbiddenException('You do not have permission to add stops to this trip');
        }

        const stint = await this.stintsService.findOne(createStopDto.stint_id);
        if (!stint) {
            throw new NotFoundException(`Stint with ID ${createStopDto.stint_id} not found`);
        }
        if (stint.trip_id !== createStopDto.trip_id) {
            throw new ForbiddenException('The stint does not belong to the specified trip');
        }

        const stop = this.stopsRepository.create(createStopDto);
        const savedStop = await this.stopsRepository.save(stop);

        //TODO: need to handle legs here

        return savedStop;
    }

    //using this method so we can ensure that the stop is created in same transaction
    async createWithTransaction(stopData: Partial<Stop>, manager: EntityManager): Promise<Stop> {
        const stopRepo = manager.getRepository(Stop);
        const stop = stopRepo.create(stopData);
        return stopRepo.save(stop);
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
            throw new NotFoundException(`No stops found for stint with ID ${stint_id}`);
        }
        return stops;
    }

    async update(id: number, updateStopDto: UpdateStopDto, userId: number): Promise<Stop> {
        const stop = await this.findOne(id);

        const trip = await this.tripsService.findOne(stop.trip_id);
        if (trip.creator_id !== userId) {
            throw new ForbiddenException('You do not have permission to update this stop');
        }
        const stint = await this.stintsService.findOne(stop.stint_id);
        if (updateStopDto.stint_id && updateStopDto.stint_id !== stop.stint_id) {
            const newStint = await this.stintsService.findOne(updateStopDto.stint_id);
            if (newStint.trip_id !== stop.trip_id) {
                throw new ForbiddenException('The new stint must belong to the same trip');
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
            throw new ForbiddenException('You do not have permission to delete this stop');
        }

        await this.stopsRepository.remove(stop);
    }
}