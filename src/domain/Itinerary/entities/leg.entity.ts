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
import { Stop } from './stop.entity';

//tbd if we even want this
export enum RouteType {
  HIGHWAY = 'highway',
  BACKROAD = 'backroad',
  CITY = 'city',
  MIXED = 'mixed',
}

@Entity('legs')
export class Leg {
  @PrimaryGeneratedColumn()
  leg_id: number;

  @Column()
  sequence_number: number;

  @Column({ type: 'float' })
  distance: number;

  @Column({ type: 'integer' })
  estimated_travel_time: number;

  // optional - may remove
  @Column({
    type: 'enum',
    enum: RouteType,
    default: RouteType.HIGHWAY,
    nullable: true,
  })
  route_type: RouteType;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ type: 'text', nullable: true })
  polyline: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Stint, (stint) => stint.legs)
  @JoinColumn({ name: 'stint_id' })
  stint: Stint;

  @Column()
  stint_id: number;

  @ManyToOne(() => Stop)
  @JoinColumn({ name: 'start_stop_id' })
  start_stop: Stop;

  @Column()
  start_stop_id: number;

  @ManyToOne(() => Stop)
  @JoinColumn({ name: 'end_stop_id' })
  end_stop: Stop;

  @Column()
  end_stop_id: number;
}
