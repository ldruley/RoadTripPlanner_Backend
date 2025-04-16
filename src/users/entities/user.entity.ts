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

  // This could be modified to avoid using an empty string
  // However, if the database schema must not have NULL constraints for the password

  @Column()
  @Exclude({ toPlainOnly: true })
  password_hash: string;

  // How it would be modified
  // @Column({ nullable: true })
  // @Exclude({ toPlainOnly: true })
  // password_hash?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => Trip, (trip) => trip.creator)
  created_trips: Trip[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  owned_vehicles: Vehicle[];

  // OAuth Fields
  @Column({ nullable: true })
  authProvider?: 'google' | 'local';

  @Column({ nullable: true })
  picture?: string; // optional profile photo
}
