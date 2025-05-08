import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ParticipantRole } from '../../../common/enums';
import { Trip } from './trip.entity';

@Entity('trip_participants')
export class TripParticipant {
  @PrimaryColumn()
  trip_id: number;

  @PrimaryColumn()
  user_id: number;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role: ParticipantRole;

  @CreateDateColumn()
  joined_at: Date;
}
