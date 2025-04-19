import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StintParticipant } from '../entities/stint-participant.entity';
import { ParticipantRole } from '../../../common/enums';

@Injectable()
export class StintParticipantRepository extends Repository<StintParticipant> {
  constructor(private dataSource: DataSource) {
    super(StintParticipant, dataSource.createEntityManager());
  }

  findByStint(stint_id: number): Promise<StintParticipant[]> {
    return this.find({ where: { stint_id } });
  }

  findByUser(user_id: number): Promise<StintParticipant[]> {
    return this.find({ where: { user_id } });
  }

  findByStintAndUser(
    stint_id: number,
    user_id: number,
  ): Promise<StintParticipant | null> {
    return this.findOne({ where: { stint_id, user_id } });
  }

  findByStintAndRole(
    stint_id: number,
    role: ParticipantRole,
  ): Promise<StintParticipant[]> {
    return this.find({ where: { stint_id, role } });
  }
}
