import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum SupplyCategory {
  FOOD = 'food',
  GEAR = 'gear',
  EMERGENCY = 'emergency',
  CLOTHING = 'clothing',
  ELECTRONICS = 'electronics',
  OTHER = 'other',
}

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
