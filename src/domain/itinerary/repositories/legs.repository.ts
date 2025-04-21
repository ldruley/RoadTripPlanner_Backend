import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Leg } from '../entities/leg.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LegsRepository extends Repository<Leg> {
  constructor(private dataSource: DataSource) {
    super(Leg, dataSource.createEntityManager());
  }

  findById(leg_id: number): Promise<Leg | null> {
    return this.findOne({ where: { leg_id } });
  }

  findByStint(stint_id: number): Promise<Leg[]> {
    return this.find({
      where: { stint_id },
      order: { sequence_number: 'ASC' },
    });
  }

  findLegsAffectedByStopChange(stop_id: number): Promise<Leg[]> {
    return this.find({
      where: [{ start_stop_id: stop_id }, { end_stop_id: stop_id }],
    });
  }

  findByStartStop(stop_id: number): Promise<Leg[]> {
    return this.find({ where: { start_stop_id: stop_id } });
  }

  findByEndStop(stop_id: number): Promise<Leg[]> {
    return this.find({ where: { end_stop_id: stop_id } });
  }

  findLegBetweenStops(
    start_stop_id: number,
    end_stop_id: number,
  ): Promise<Leg | null> {
    return this.findOne({
      where: {
        start_stop_id,
        end_stop_id,
      },
    });
  }

  /**
   * Calculate the sum of estimated travel times for all legs in a stint
   * @param stint_id The stint ID
   * @returns The total estimated travel time in minutes, or 0 if no legs exist
   */
  async sumEstimatedTravelTime(stint_id: number): Promise<number> {
    const result: { total: string | null } | undefined =
      await this.createQueryBuilder('leg')
        .select('SUM(leg.estimated_travel_time)', 'total')
        .where('leg.stint_id = :stint_id', { stint_id })
        .getRawOne();

    return result?.total ? Number(result.total) : 0;
  }

  /**
   * Calculate the sum of estimated distances for all legs in a stint
   * @param stint_id The stint ID
   * @returns The total estimated distance in miles, or 0 if no legs exist
   */
  async sumEstimatedTravelDistance(stint_id: number): Promise<number> {
    const result: { total: string | null } | undefined =
      await this.createQueryBuilder('leg')
        .select('SUM(leg.estimated_distance)', 'total')
        .where('leg.stint_id = :stint_id', { stint_id })
        .getRawOne();

    return result?.total ? Number(result.total) : 0;
  }

  //findLegsAffectedBySequenceChange
}
