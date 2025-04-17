import {Injectable} from "@nestjs/common";
import {Stop} from "../entities/stop.entity";
import {DataSource, Repository} from "typeorm";

@Injectable()
export class StopsRepository extends Repository<Stop> {
    constructor(private dataSource: DataSource) {
        super(Stop, dataSource.createEntityManager());
    }

    findById(stop_id: number): Promise<Stop | null> {
        return this.findOne({ where: { stop_id } });
    }

    findAllByTrip(trip_id: number): Promise<Stop[]> {
        return this.find({ where: { trip_id } });
    }

    findByStint(stint_id: number): Promise<Stop[]> {
        return this.find({
            where: {stint_id},
            order: {sequence_number: 'ASC'}
        });
    }

    findAdjacentStops(stint_id: number, sequence_number: number): Promise<Stop[]> {
        return this.find({
            where: [
                { stint_id, sequence_number: sequence_number - 1 },
                { stint_id, sequence_number: sequence_number + 1 }
            ]
        });
    }
}