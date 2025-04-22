import { DataSource, Repository } from 'typeorm';
import { Stint } from '../entities/stint.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StintsRepository extends Repository<Stint> {
  constructor(private dataSource: DataSource) {
    super(Stint, dataSource.createEntityManager());
  }

  findById(stint_id: number): Promise<Stint | null> {
    return this.findOne({ where: { stint_id } });
  }

  findAllByTrip(trip_id: number): Promise<Stint[]> {
    return this.find({ where: { trip_id } });
  }

  async findMaxSequenceNumber(trip_id: number) {
    const result: { maxSequence: string | null } | undefined =
      await this.createQueryBuilder('stint')
        .select('MAX(stint.sequence_number)', 'maxSequence')
        .where('stint.trip_id = :trip_id', { trip_id })
        .getRawOne();

    return result?.maxSequence ? Number(result.maxSequence) : 0;
  }
}
