import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Stint } from './stint.entity';
import { StopType } from '../../../common/enums';
import { Location } from '../../locations/entities/location.entity';

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

  //Relations

  @ManyToOne(() => Stint, (stint) => stint.stops, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stint_id' })
  stint: Stint;

  @Column({ nullable: true })
  stint_id: number;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ nullable: true })
  location_id: number;
}
