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
import { Trip } from '../../trips/entities/trip.entity';
import { Stop } from './stop.entity';
import { Leg } from './leg.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Supply } from '../../supplies/entities/supply.entity';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('stints')
export class Stint {
  @PrimaryGeneratedColumn()
  stint_id: number;

  @Column()
  sequence_number: number;

  @Column()
  name: string;

  @Column({ type: 'float', nullable: true })
  distance: number;

  @Column({ type: 'integer', nullable: true })
  estimated_duration: number;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ nullable: true })
  continues_from_previous: boolean;

  // Time spent at the transition stop - only relevant if the stint is a transition stint
  @Column({ nullable: true })
  transition_duration: number;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations

  @ManyToOne(() => Trip, (trip) => trip.stints)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column()
  trip_id: number;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'start_location_id' })
  start_location: Location;

  @Column({ nullable: true })
  start_location_id: number;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'end_location_id' })
  end_location: Location;

  @Column({ nullable: true })
  end_location_id: number;

  @OneToMany(() => Stop, (stop) => stop.stint)
  stops: Stop[];

  @OneToMany(() => Leg, (leg) => leg.stint)
  legs: Leg[];

  // Many-to-many relation with users (participants)
  @ManyToMany(() => User)
  @JoinTable({
    name: 'stint_participants',
    joinColumn: {
      name: 'stint_id',
      referencedColumnName: 'stint_id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'user_id',
    },
  })
  participants: User[];

  // Many-to-many relation with vehicles
  /* @ManyToMany(() => Vehicle)
  @JoinTable({
    name: 'stint_vehicles',
    joinColumn: {
      name: 'stint_id',
      referencedColumnName: 'stint_id',
    },
    inverseJoinColumn: {
      name: 'vehicle_id',
      referencedColumnName: 'vehicle_id',
    },
  })
  vehicles: Vehicle[];*/
  /*
              // Many-to-many relation with supplies
              @ManyToMany(() => Supply)
              @JoinTable({
                  name: 'stint_supplies',
                  joinColumn: {
                      name: 'stint_id',
                      referencedColumnName: 'stint_id',
                  },
                  inverseJoinColumn: {
                      name: 'supply_id',
                      referencedColumnName: 'supply_id',
                  },
              })
              supplies: Supply[];*/
}
