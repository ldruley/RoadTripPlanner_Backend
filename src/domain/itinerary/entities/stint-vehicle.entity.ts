import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Stint } from './stint.entity';

@Entity('stint_vehicles')
export class StintVehicle {
  @PrimaryGeneratedColumn()
  stint_vehicle_id: number;

  @ManyToOne(() => Stint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stint_id' })
  stint: Stint;

  @Column()
  stint_id: number;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column()
  vehicle_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ nullable: true })
  driver_id: number;

  @CreateDateColumn()
  created_at: Date;
}
