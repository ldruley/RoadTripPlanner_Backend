import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {VehiclesRepository} from "./repository/vehicles.repository";
import {CreateVehicleDto} from "./dto/create-vehicle-dto";
import {Vehicle} from "./entities/vehicle.entity";
import {UpdateVehicleDto} from "./dto/update-vehicle-dto";

@Injectable()
export class VehiclesService {

    constructor(
        private vehiclesRepository: VehiclesRepository,
    ){}

    async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
        const vehicle = this.vehiclesRepository.create(createVehicleDto);
        return this.vehiclesRepository.save(vehicle);
    }

    async findOne(id: number): Promise<Vehicle> {
        const vehicle = await this.vehiclesRepository.findById(id);
        if (!vehicle) {
            throw new NotFoundException(`Vehicle with ID ${id} not found`);
        }
        return vehicle;
    }

    async findByOwner(ownerId: number): Promise<Vehicle[]> {
        const vehicles = await this.vehiclesRepository.findByOwner(ownerId);
        if (!vehicles || vehicles.length === 0) {
            throw new NotFoundException(`No vehicles found for owner with ID ${ownerId}`);
        }
        return vehicles;
    }

    async update (id: number, updateVehicleDto: UpdateVehicleDto, userId: number): Promise<Vehicle> {
        const vehicle = await this.findOne(id);
        if (vehicle.owner_id !== userId) {
            throw new ForbiddenException(`You don't have permission to update this vehicle`);
        } else if (!vehicle) {
            throw new NotFoundException(`Vehicle with ID ${id} not found`);
        }

        Object.assign(vehicle, updateVehicleDto);
        return this.vehiclesRepository.save(vehicle);
    }

    async remove(id: number, userId: number): Promise<void> {
        const vehicle = await this.findOne(id);
        if (vehicle.owner_id !== userId) {
            throw new ForbiddenException(`You don't have permission to delete this vehicle`);
        }

        await this.vehiclesRepository.remove(vehicle);
    }
}
