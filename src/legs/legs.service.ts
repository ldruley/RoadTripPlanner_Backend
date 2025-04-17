import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LegsRepository } from './repository/legs.repository';
import { CreateLegDto } from './dto/create-leg.dto';
import { UpdateLegDto } from './dto/update-leg.dto';
import { Leg } from './entities/leg.entity';

@Injectable()
export class LegsService {
    constructor(
        private legsRepository: LegsRepository,
    ) {
    }

    async create(createLegDto: CreateLegDto): Promise<Leg> {
        const leg = this.legsRepository.create(createLegDto);
        return this.legsRepository.save(leg);
    }

    async findOne(id: number): Promise<Leg> {
        const leg = await this.legsRepository.findById(id);
        if (!leg) {
            throw new NotFoundException(`Leg with ID ${id} not found`);
        }
        return leg;
    }

    async findAllByStint(stintId: number): Promise<Leg[]> {
        const legs = await this.legsRepository.findByStint(stintId);
        if (!legs || legs.length === 0) {
            throw new NotFoundException(`No legs found for stint with ID ${stintId}`);
        }
        return legs;
    }

    async findLegBetweenStops(startStopId: number, endStopId: number): Promise<Leg | null> {
        return this.legsRepository.findLegBetweenStops(startStopId, endStopId);
    }

    //async update
    //async remove
    //update legs after stop changes
}