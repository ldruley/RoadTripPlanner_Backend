import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { Stint } from '../../stints/entities/stint.entity';

export enum StopType {
  PITSTOP = 'pitstop',
  OVERNIGHT = 'overnight',
  GAS = 'gas',
  FOOD = 'food',
  ATTRACTION = 'attraction',
  OTHER = 'other',
}

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn()
  stop_id: number;

  @Column()
  name: string;

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: StopType,
    default: StopType.PITSTOP,
  })
  stop_type: StopType;

  @Column({ type: 'timestamp', nullable: true })
  arrival_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  departure_time: Date;

  @Column({ type: 'integer', nullable: true })
  duration: number;

  @Column()
  sequence_number: number;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  /*   @ManyToOne(() => Trip, (trip) => trip.stops)
    @JoinColumn({ name: 'trip_id' })
    trip: Trip;*/

  @Column()
  trip_id: number;

  /*    @ManyToOne(() => Stint, (stint) => stint.stops, { nullable: true })
    @JoinColumn({ name: 'stint_id' })
    stint: Stint;

    @Column({ nullable: true })
    stint_id: number;*/
}
