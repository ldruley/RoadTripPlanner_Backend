import {DataSource, Repository} from "typeorm";
import {Leg} from "../entities/leg.entity";
import {Injectable} from "@nestjs/common";

@Injectable()
export class LegsRepository extends Repository<Leg> {

    constructor (private dataSource: DataSource) {
        super(Leg, dataSource.createEntityManager());
    }

    findById(leg_id: number): Promise<Leg | null> {
        return this.findOne({ where: { leg_id } });
    }

    findByStint(stint_id: number): Promise<Leg[]> {
        return this.find({
            where: {stint_id},
            order: {sequence_number: 'ASC'}
        });
    }

    findByStartStop(stop_id: number): Promise<Leg[]> {
        return this.find({ where: {start_stop_id: stop_id} });
    }

    findByEndStop(stop_id: number): Promise<Leg[]> {
        return this.find({ where: {end_stop_id: stop_id} });
    }

    findLegBetweenStops(start_stop_id: number, end_stop_id: number): Promise<Leg | null> {
        return this.findOne({
            where: {
                start_stop_id,
                end_stop_id
            }
        });
    }

    //findLegsAffectedBySequenceChange

}
