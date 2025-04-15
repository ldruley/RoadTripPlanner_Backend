import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn} from 'typeorm';
import {SupplyCategory} from "../../common/enums";

@Entity('supplies')
export class Supply {
    @PrimaryGeneratedColumn()
    supply_id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: SupplyCategory,
        default: SupplyCategory.OTHER,
    })
    category: SupplyCategory;

    @CreateDateColumn()
    created_at: Date;
}