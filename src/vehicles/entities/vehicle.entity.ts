import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn()
    vehicle_id: number;

    @Column()
    name: string;

    @Column()
    year: number;

    @Column({ type: 'float', nullable: true })
    fuel_capacity: number;

    @Column({ type: 'float', nullable: true })
    mpg: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.owned_vehicles)
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @Column()
    owner_id: number;
}