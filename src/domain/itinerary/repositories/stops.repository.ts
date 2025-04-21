import { Injectable } from '@nestjs/common';
import { Stop } from '../entities/stop.entity';
import { DataSource, Repository } from 'typeorm';

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
      where: { stint_id },
      order: { sequence_number: 'ASC' },
    });
  }

  /**
   * Find the maximum sequence number for stops in a stint
   * @param stint_id The stint ID
   * @returns The maximum sequence number, or 0 if no stops exist
   */
  async findMaxSequenceNumber(stint_id: number): Promise<number> {
    const result: { maxSequence: string | null } | undefined =
      await this.createQueryBuilder('stop')
        .select('MAX(stop.sequence_number)', 'maxSequence')
        .where('stop.stint_id = :stint_id', { stint_id })
        .getRawOne();

    return result?.maxSequence ? Number(result.maxSequence) : 0;
  }

  findAdjacentStops(
    stint_id: number,
    sequence_number: number,
  ): Promise<Stop[]> {
    return this.find({
      where: [
        { stint_id, sequence_number: sequence_number - 1 },
        { stint_id, sequence_number: sequence_number + 1 },
      ],
    });
  }

  /**
   * Calculate the sum of duration for all stops in a stint
   * @param stint_id The stint ID
   * @returns The total duration in minutes, or 0 if no stops exist or durations are null
   */
  async sumDuration(stint_id: number): Promise<number> {
    const result: { total: string | null } | undefined =
      await this.createQueryBuilder('stop')
        .select('SUM(stop.duration)', 'total')
        .where('stop.stint_id = :stint_id', { stint_id })
        .andWhere('stop.duration IS NOT NULL') // Only include stops with duration
        .getRawOne();

    return result?.total ? Number(result.total) : 0;
  }
}
