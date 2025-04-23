import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLegDto } from '../dto/create-leg.dto';
import { Leg } from '../entities/leg.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LegsService {
  constructor(
    @InjectRepository(Leg)
    private legRepository: Repository<Leg>,
  ) {}

  /**
   * Create a new leg
   * @param createLegDto The leg data to create
   * @returns The created leg
   */
  async create(createLegDto: CreateLegDto): Promise<Leg> {
    const leg = this.legRepository.create(createLegDto);
    return this.legRepository.save(leg);
  }

  /**
   * Find a leg by its ID
   * @param leg_id The leg ID
   * @returns The leg if found, or null if not found
   */
  async findById(leg_id: number): Promise<Leg | null> {
    return this.legRepository.findOne({ where: { leg_id } });
  }

  /**
   * Find all legs in a stint
   * @param stint_id The stint ID
   * @returns An array of legs in the specified stint
   */
  async findAllByStint(stint_id: number): Promise<Leg[]> {
    const legs = await this.legRepository.find({
      where: { stint_id },
      order: { sequence_number: 'ASC' },
    });

    if (!legs || legs.length === 0) {
      throw new NotFoundException('No legs found for this stint');
    }

    return legs;
  }

  /**
   * Find a leg by it's start id
   * @param stop_id The starting stop ID
   * @returns An array of legs that start at the specified stop
   */
  async findByStartStop(stop_id: number): Promise<Leg[]> {
    return this.legRepository.find({ where: { start_stop_id: stop_id } });
  }

  /**
   * Find a leg by it's end id
   * @param stop_id The ending stop ID
   * @returns An array of legs that end at the specified stop
   */
  async findByEndStop(stop_id: number): Promise<Leg[]> {
    return this.legRepository.find({ where: { end_stop_id: stop_id } });
  }

  /**
   * Find a leg between two stops
   * @param start_stop_id The starting stop ID
   * @param end_stop_id The ending stop ID
   * @returns The leg if found, or null if not found
   */
  async findLegBetweenStops(
    start_stop_id: number,
    end_stop_id: number,
  ): Promise<Leg | null> {
    return this.legRepository.findOne({
      where: {
        start_stop_id,
        end_stop_id,
      },
    });
  }

  /**
   * Calculate the sum of estimated travel times for all legs in a stint
   * @param stintId The stint ID
   * @returns The total estimated travel time in minutes, or 0 if no legs exist
   */
  async sumEstimatedTravelTime(stintId: number): Promise<number> {
    const result: { total: number } | undefined = await this.legRepository
      .createQueryBuilder('leg')
      .select('SUM(leg.estimated_travel_time)', 'total')
      .where('leg.stint_id = :stint_id', { stint_id: stintId })
      .getRawOne();

    return result?.total ? Number(result.total) : 0;
  }

  /**
   * Calculate the sum of estimated distances for all legs in a stint
   * @param stintId The stint ID
   * @returns The total estimated distance in miles, or 0 if no legs exist
   */
  async sumEstimatedTravelDistance(stintId: number): Promise<number> {
    const result: { total: number } | undefined = await this.legRepository
      .createQueryBuilder('leg')
      .select('SUM(leg.distance)', 'total')
      .where('leg.stint_id = :stint_id', { stint_id: stintId })
      .getRawOne();

    return result?.total ? Number(result.total) : 0;
  }

  //TODO
  //async update
  //async remove
  //update legs after stop changes
}
