import {Injectable} from "@nestjs/common";
import {DataSource, Repository} from "typeorm";
import {Vehicle} from "../entities/vehicle.entity";
@Injectable()
export class VehiclesRepository extends Repository<Vehicle> {


    constructor(private dataSource: DataSource) {
        super(Vehicle, dataSource.createEntityManager());
    }

    findById(vehicle_id: number): Promise<Vehicle | null> {
        return this.findOne({where: {vehicle_id}});
    }

    findByOwner(owner_id: number): Promise<Vehicle[]> {
        return this.find({where: {owner_id}});
    }

}
