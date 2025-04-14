import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { Stop } from '../../stops/entities/stop.entity';
import { Leg } from '../../legs/entities/leg.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity('stints')
export class Stint {
    @PrimaryGeneratedColumn('uuid')
    stint_id: string;

    @Column()
    sequence_number: number;

    @Column()
    name: string;

    @Column({ type: 'float', nullable: true })
    distance: number;

    @Column({ type: 'integer', nullable: true })
    estimated_duration: number;

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
    trip_id: string;

    @ManyToOne(() => Stop)
    @JoinColumn({ name: 'start_location_id' })
    start_location: Stop;

    @Column()
    start_location_id: string;

    @ManyToOne(() => Stop)
    @JoinColumn({ name: 'end_location_id' })
    end_location: Stop;

    @Column()
    end_location_id: string;

    @OneToMany(() => Stop, (stop) => stop.stint)
    stops: Stop[];

    @OneToMany(() => Leg, (leg) => leg.stint)
    legs: Leg[];

    // Many-to-many relation with vehicles
    @ManyToMany(() => Vehicle)
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
    vehicles: Vehicle[];

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
    supplies: Supply[];
}