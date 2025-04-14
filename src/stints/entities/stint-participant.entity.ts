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
    @PrimaryGeneratedColumn('uuid')
    participant_id: string;

    @ManyToOne(() => Stint)
    @JoinColumn({ name: 'stint_id' })
    stint: Stint;

    @Column()
    stint_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    user_id: string;

    @Column({
        type: 'enum',
        enum: ParticipantRole,
        default: ParticipantRole.MEMBER,
    })
    role: ParticipantRole;

    @CreateDateColumn()
    joined_at: Date;
}