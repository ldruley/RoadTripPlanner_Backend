import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Stint } from '../../itinerary/entities/stint.entity';
import { Stop } from '../../itinerary/entities/stop.entity';
import { Supply } from '../../supplies/entities/supply.entity';
import { TripSupply } from './trip.supplies.entity';
import { TripParticipant } from './trip-participant.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn()
  trip_id: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'float', nullable: true })
  total_distance: number;

  @Column({ default: false })
  is_public: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.created_trips)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column()
  creator_id: number;

  @OneToMany(() => Stint, (stint) => stint.trip, { cascade: true })
  stints: Stint[];

  @OneToMany(() => TripParticipant, (participant) => participant.trip, {
    cascade: true,
  })
  participants: TripParticipant[];

  @OneToMany(() => TripSupply, (tripSupply) => tripSupply.trip, {
    cascade: true,
  })
  supplies: TripSupply[];
}
