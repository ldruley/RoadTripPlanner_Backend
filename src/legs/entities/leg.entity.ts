import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Stint } from '../../stints/entities/stint.entity';
import { Stop } from '../../stops/entities/stop.entity';

export enum RouteType {
    HIGHWAY = 'highway',
    BACKROAD = 'backroad',
    CITY = 'city',
    MIXED = 'mixed',
}

export enum TrafficCondition {
    LIGHT = 'light',
    MODERATE = 'moderate',
    HEAVY = 'heavy',
    UNKNOWN = 'unknown',
}

@Entity('legs')
export class Leg {
    @PrimaryGeneratedColumn('uuid')
    leg_id: string;

    @Column()
    sequence_number: number;

    @Column({ type: 'float' })
    distance: number;

    @Column({ type: 'integer' })
    estimated_travel_time: number;

    @Column({
        type: 'enum',
        enum: RouteType,
        default: RouteType.HIGHWAY,
        nullable: true,
    })
    route_type: RouteType;

    @Column({
        type: 'enum',
        enum: TrafficCondition,
        default: TrafficCondition.UNKNOWN,
        nullable: true,
    })
    traffic_conditions: TrafficCondition;

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
    stint_id: string;

    @ManyToOne(() => Stop)
    @JoinColumn({ name: 'start_stop_id' })
    start_stop: Stop;

    @Column()
    start_stop_id: string;

    @ManyToOne(() => Stop)
    @JoinColumn({ name: 'end_stop_id' })
    end_stop: Stop;

    @Column()
    end_stop_id: string;
}