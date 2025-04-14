import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Stint } from '../../stints/entities/stint.entity';
import { Stop } from '../../stops/entities/stop.entity';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity('trips')
export class Trip {
    @PrimaryGeneratedColumn('uuid')
    trip_id: string;

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
    creator_id: string;

    @OneToMany(() => Stint, (stint) => stint.trip)
    stints: Stint[];

    @OneToMany(() => Stop, (stop) => stop.trip)
    stops: Stop[];

    // Many-to-many relation with users (participants)
    @ManyToMany(() => User)
    @JoinTable({
        name: 'trip_participants',
        joinColumn: {
            name: 'trip_id',
            referencedColumnName: 'trip_id',
        },
        inverseJoinColumn: {
            name: 'user_id',
            referencedColumnName: 'user_id',
        },
    })
    participants: User[];

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
    supplies: Supply[];
}