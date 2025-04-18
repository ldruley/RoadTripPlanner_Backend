import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Trip } from "../entities/trip.entity";

@Injectable()
export class TripsRepository extends Repository<Trip> {

    constructor(private dataSource: DataSource) {
        super(Trip, dataSource.createEntityManager());
    }

    findById(trip_id: number): Promise<Trip | null> {
        return this.findOne({ where: { trip_id } });
    }

    findByCreator(creator_id: number): Promise<Trip[]> {
        return this.find({ where: { creator_id } });
    }

    findPublicTrips(is_public: boolean): Promise<Trip[]> {
        return this.find({ where: { is_public } });
    }
}