/*
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Stint } from './stint.entity';
import { ParticipantRole } from '../../../common/enums';

@Entity('stint_participants')
export class StintParticipant {
  @PrimaryGeneratedColumn()
  participant_id: number;

  @ManyToOne(() => Stint)
  @JoinColumn({ name: 'stint_id' })
  stint: Stint;

  @Column()
  stint_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role: ParticipantRole;

  @CreateDateColumn()
  joined_at: Date;
}
*/
