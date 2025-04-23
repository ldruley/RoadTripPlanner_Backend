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

  @OneToMany(() => Stint, (stint) => stint.trip)
  stints: Stint[];

  @OneToMany(() => Stop, (stop) => stop.trip)
  stops: Stop[];

  /*
    // Many-to-many relation with supplies
    @ManyToMany(() => Supply)
    @JoinTable({
        name: 'trip_supplies',
        joinColumn: {
            name: 'trip_id',
            referencedColumnName: 'trip_id',
        },
        inverseJoinColumn: {
            name: 'supply_id',
            referencedColumnName: 'supply_id',
        },
    })
    supplies: Supply[];*/
}
