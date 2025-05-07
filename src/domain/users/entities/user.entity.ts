import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Trip } from '../../trips/entities/trip.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { TripParticipant } from '../../trips/entities/trip-participant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  fullname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password_hash: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => Trip, (trip) => trip.creator)
  created_trips: Trip[];

  @OneToMany(() => TripParticipant, (tripParticipant) => tripParticipant.user)
  tripParticipants: TripParticipant[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  owned_vehicles: Vehicle[];

  @Column({ nullable: true })
  authProvider?: 'google' | 'local';

  @Column({ nullable: true })
  picture?: string;
}
