import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {CreateStintDto} from "./dto/create-stint-dto";
import {StintsRepository} from "./repository/stints.repository";
import {Stint} from "./entities/stint.entity";
import {UpdateStintDto} from "./dto/update-sprint-dto";

@Injectable()
export class StintsService {

    constructor(
        private stintsRepository: StintsRepository,
    ) {}

    async create(createStintDto: CreateStintDto): Promise<any> {
        const stint = this.stintsRepository.create(createStintDto);
        return this.stintsRepository.save(stint);
    }

    async findOne(id: number): Promise<Stint> {
        const stint = await this.stintsRepository.findById(id);
        if (!stint) {
            throw new NotFoundException(`Stint with ID ${id} not found`);
        }
        return stint;
    }

    async findAllByTrip(trip_id: number): Promise<Stint[]> {
        const stints = await this.stintsRepository.findAllByTrip(trip_id);
        if (!stints || stints.length === 0) {
            throw new NotFoundException(`No stints found for trip with ID ${trip_id}`);
        }
        return stints;
    }

    async update(id: number, updateStintDto: UpdateStintDto, userId: number): Promise<Stint> {
        const stint = await this.findOne(id);
        if (stint.trip.creator_id !== userId) {
            throw new ForbiddenException(`You don't have permission to update this stint`);
        }

        Object.assign(stint, updateStintDto);

        return this.stintsRepository.save(stint);
    }

    async remove(id: number, userId: number): Promise<void> {
        const stint = await this.findOne(id);
        if (stint.trip.creator_id !== userId) {
            throw new ForbiddenException(`You don't have permission to delete this stint`);
        }

        await this.stintsRepository.remove(stint);
    }
}
