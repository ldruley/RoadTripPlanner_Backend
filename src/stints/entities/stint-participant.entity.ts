import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Stint } from '../../stints/entities/stint.entity';

export enum ParticipantRole {
    CREATOR = 'creator',
    MEMBER = 'member',
    DRIVER = 'driver',
    PLANNER = 'planner',
}

@Entity('stint_participants')
export class StintParticipant {
    @PrimaryGeneratedColumn()
    participant_id: number;

    @ManyToOne(() => Stint)
    @JoinColumn({ name: 'stint_id' })
    stint: Stint;

    @Column()
    stint_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    user_id: number;

    @Column({
        type: 'enum',
        enum: ParticipantRole,
        default: ParticipantRole.MEMBER,
    })
    role: ParticipantRole;

    @CreateDateColumn()
    joined_at: Date;
}